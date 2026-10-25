import { getAll } from '../core/demo-db';
import { DemoContext } from '../core/demo-context';
import { conflict, DemoResult, ok, serviceUnavailable, unprocessable } from '../core/demo-result';
import { BamParametersEntity, CreditRateEntity, InvestmentCreditParametersEntity, MourabahaParametersEntity } from '../core/entities';
import { MortgageCreditRequest, MortgageCreditResponse } from '../../core/models/mortgage-credit.model';
import { InvestmentCreditRequest, InvestmentCreditResponse } from '../../core/models/investment-credit.model';
import * as calc from '../domain/calc-engine';
import { openDemandFromSimulation } from '../domain/workflow-engine';

const MAX_LEGAL_RATE = 14.0;

function pct(ratio: number): string {
  const v = Math.round(ratio * 10000) / 100;
  return String(v);
}

async function activeBam(): Promise<BamParametersEntity> {
  const bam = (await getAll<BamParametersEntity>('bamParameters')).find((b) => b.active);
  if (!bam) {
    throw serviceUnavailable('Les paramètres de frais BAM ne sont pas configurés.');
  }
  return bam;
}

async function simulateMortgage(ctx: DemoContext): Promise<DemoResult> {
  const req = (ctx.body ?? {}) as MortgageCreditRequest;
  const productType = req.productType ?? 'CONVENTIONAL';
  const capital = req.amount;
  const duration = req.duration;
  const coBorrower = req.coBorrower === true;
  const totalMonthlyIncome = calc.money(req.monthlyIncome + (coBorrower ? req.coBorrowerMonthlyIncome ?? 0 : 0));

  const bam = await activeBam();

  let applicableRate: number;
  let taeg: number;
  let schedule;
  let conventional: MortgageCreditResponse['conventional'] = null;
  let mourabaha: MortgageCreditResponse['mourabaha'] = null;
  let fees: { registrationFees: number; landConservationFees: number; notaryFees: number; processingFees: number; totalFees: number };

  if (productType === 'MOURABAHA') {
    const mp = (await getAll<MourabahaParametersEntity>('mourabahaParameters')).find((m) => m.active);
    if (!mp) {
      throw serviceUnavailable('Les paramètres Mourabaha ne sont pas configurés.');
    }
    assertWithinLtv(capital, req.propertyValue, bam);
    assertEligibleAge(req.age, duration, bam);
    const params = { profitRate: mp.profitRate, vatRate: mp.vatRate, takafulMonthlyRate: mp.takafulMonthlyRate };
    const s = calc.computeMourabaha(capital, req.propertyValue, params, duration, bam, coBorrower);
    assertWithinDebtRatio(s.allInMonthlyPaymentTtc, totalMonthlyIncome, bam);
    applicableRate = mp.profitRate;
    taeg = calc.calculateTaeg(capital, s.processingFees, s.allInMonthlyPaymentTtc, duration);
    schedule = calc.computeMourabahaSchedule(capital, params, duration);
    mourabaha = {
      marginHt: s.marginHt,
      vatOnMargin: s.vatOnMargin,
      marginTtc: s.marginTtc,
      monthlyPaymentTtc: s.monthlyPaymentTtc,
      takafulMonthlyContribution: s.takafulMonthlyContribution,
      allInMonthlyPaymentTtc: s.allInMonthlyPaymentTtc,
      totalTakafulCost: s.totalTakafulCost,
      totalCostTtc: s.totalCostTtc,
    };
    fees = { registrationFees: s.registrationFees, landConservationFees: s.landConservationFees, notaryFees: s.notaryFees, processingFees: s.processingFees, totalFees: s.totalFees };
  } else {
    const creditRate = (await getAll<CreditRateEntity>('creditRates')).find((r) => r.cspCode === req.cspCode && r.active);
    if (!creditRate) {
      throw conflict('Catégorie socio-professionnelle non prise en charge ou inactive.');
    }
    if (duration < creditRate.minDurationMonths || duration > creditRate.maxDurationMonths) {
      throw unprocessable('Durée hors plage autorisée pour ce profil CSP (réglementation BAM).');
    }
    assertWithinLtv(capital, req.propertyValue, bam);
    assertEligibleAge(req.age, duration, bam);
    applicableRate = calc.applyRateFormula(creditRate.rateMin, creditRate.rateMax, creditRate.rateFormula);
    const applicable = calc.computeConventionalAtRate(capital, req.propertyValue, applicableRate, duration, bam, coBorrower);
    const atMin = calc.computeConventionalAtRate(capital, req.propertyValue, creditRate.rateMin, duration, bam, coBorrower);
    const atMax = calc.computeConventionalAtRate(capital, req.propertyValue, creditRate.rateMax, duration, bam, coBorrower);
    assertWithinDebtRatio(applicable.allInMonthlyPayment, totalMonthlyIncome, bam);
    taeg = calc.calculateTaeg(capital, applicable.processingFees, applicable.allInMonthlyPayment, duration);
    schedule = calc.computeConventionalSchedule(capital, applicableRate, applicable.monthlyPayment, duration);
    conventional = {
      rateMin: creditRate.rateMin,
      rateMax: creditRate.rateMax,
      monthlyPayment: applicable.monthlyPayment,
      adiMonthlyPremium: applicable.adiMonthlyPremium,
      allInMonthlyPayment: applicable.allInMonthlyPayment,
      totalInterest: applicable.totalInterest,
      totalAdiCost: applicable.totalAdiCost,
      totalCost: applicable.totalCost,
      monthlyPaymentMin: atMin.monthlyPayment,
      monthlyPaymentMax: atMax.monthlyPayment,
      adiMonthlyPremiumMin: atMin.adiMonthlyPremium,
      adiMonthlyPremiumMax: atMax.adiMonthlyPremium,
      allInMonthlyPaymentMin: atMin.allInMonthlyPayment,
      allInMonthlyPaymentMax: atMax.allInMonthlyPayment,
      totalInterestMin: atMin.totalInterest,
      totalInterestMax: atMax.totalInterest,
      totalAdiCostMin: atMin.totalAdiCost,
      totalAdiCostMax: atMax.totalAdiCost,
      totalCostMin: atMin.totalCost,
      totalCostMax: atMax.totalCost,
    };
    fees = { registrationFees: applicable.registrationFees, landConservationFees: applicable.landConservationFees, notaryFees: applicable.notaryFees, processingFees: applicable.processingFees, totalFees: applicable.totalFees };
  }

  if (applicableRate > MAX_LEGAL_RATE) {
    throw unprocessable(`Le taux ${applicableRate} % dépasse le taux maximum des intérêts conventionnels fixé par Bank Al-Maghrib (${MAX_LEGAL_RATE} %).`);
  }

  const demand = await openDemandFromSimulation({
    demandType: 'MORTGAGE',
    contactName: req.applicantName,
    amount: capital,
    duration,
    applicableRate,
    contactEmail: req.email,
    contactPhone: req.phone,
    contactLanguage: null,
    mortgageDetail: {
      productType,
      cspCode: req.cspCode,
      nationalityCode: req.nationalityCode,
      moroccanResident: req.moroccanResident,
      propertyValue: req.propertyValue,
      monthlyIncome: req.monthlyIncome,
      age: req.age,
      coBorrower,
      coBorrowerMonthlyIncome: req.coBorrowerMonthlyIncome ?? null,
    },
  });

  const response: MortgageCreditResponse = {
    amount: capital,
    duration,
    cspCode: req.cspCode,
    productType,
    nationalityCode: req.nationalityCode,
    moroccanResident: req.moroccanResident,
    age: req.age,
    totalMonthlyIncome,
    applicableRate,
    taeg,
    registrationFees: fees.registrationFees,
    landConservationFees: fees.landConservationFees,
    notaryFees: fees.notaryFees,
    processingFees: fees.processingFees,
    totalFees: fees.totalFees,
    conventional,
    mourabaha,
    amortizationSchedule: schedule,
    demandReference: demand.reference,
  };
  return ok(response);
}

async function simulateInvestment(ctx: DemoContext): Promise<DemoResult> {
  const req = (ctx.body ?? {}) as InvestmentCreditRequest;
  const amount = req.amount;
  const duration = req.duration;
  const existingDebt = req.existingAnnualDebtService ?? 0;

  const params = (await getAll<InvestmentCreditParametersEntity>('investmentCreditParameters')).find(
    (p) => p.enterpriseType === req.enterpriseType && p.active,
  );
  if (!params) {
    throw serviceUnavailable("Les paramètres de crédit entreprise ne sont pas configurés pour ce type d'entreprise.");
  }

  if (req.companyAgeYears < params.minCompanyAgeYears) {
    throw unprocessable(`L'ancienneté de l'entreprise est inférieure au minimum requis de ${params.minCompanyAgeYears} ans pour ce type d'entreprise.`);
  }
  if (amount > calc.money(req.annualRevenue * params.maxFinancingToRevenueRatio)) {
    throw unprocessable(`Le montant demandé dépasse ${pct(params.maxFinancingToRevenueRatio)} % du chiffre d'affaires annuel.`);
  }
  if (req.guaranteesValue < calc.money(amount * params.minGuaranteeCoverageRatio)) {
    throw unprocessable(`Les garanties proposées couvrent moins de ${pct(params.minGuaranteeCoverageRatio)} % du montant demandé.`);
  }

  const applicableRate = calc.applyRateFormula(params.rateMin, params.rateMax, params.rateFormula);
  const snapshot = calc.computeInvestmentAtRate(amount, applicableRate, duration, {
    processingFeesRatio: params.processingFeesRatio,
    insurancePremiumRatio: params.insurancePremiumRatio,
  });

  if (applicableRate > MAX_LEGAL_RATE) {
    throw unprocessable(`Le taux ${applicableRate} % dépasse le taux maximum des intérêts conventionnels fixé par Bank Al-Maghrib (${MAX_LEGAL_RATE} %).`);
  }

  const totalAnnualDebtService = calc.money(existingDebt + snapshot.annualDebtService);
  if (totalAnnualDebtService > calc.money(req.netAnnualResult * params.maxDebtServiceRatio)) {
    throw unprocessable(`Le service de la dette annuel total dépasse ${pct(params.maxDebtServiceRatio)} % du résultat net annuel.`);
  }

  const demand = await openDemandFromSimulation({
    demandType: 'ENTERPRISE',
    contactName: req.companyName,
    amount,
    duration,
    applicableRate,
    contactEmail: req.email,
    contactPhone: req.phone,
    contactLanguage: null,
    enterpriseDetail: {
      enterpriseType: req.enterpriseType,
      annualRevenue: req.annualRevenue,
      existingAnnualDebtService: existingDebt,
      netAnnualResult: req.netAnnualResult,
      guaranteesValue: req.guaranteesValue,
      enterpriseId: null,
      sector: req.sector ?? null,
      companyAgeYears: req.companyAgeYears,
    },
  });

  const response: InvestmentCreditResponse = {
    companyName: req.companyName,
    enterpriseType: req.enterpriseType,
    sector: req.sector ?? null,
    amount,
    duration,
    applicableRate,
    monthlyPayment: snapshot.monthlyPayment,
    annualDebtService: snapshot.annualDebtService,
    totalInterest: snapshot.totalInterest,
    totalCost: snapshot.totalCost,
    processingFees: snapshot.processingFees,
    taeg: snapshot.taeg,
    demandReference: demand.reference,
    amortizationSchedule: snapshot.schedule,
  };
  return ok(response);
}

function assertWithinLtv(loan: number, propertyValue: number, bam: BamParametersEntity): void {
  const maxLoan = calc.money(propertyValue * bam.ltvRatio);
  if (loan > maxLoan) {
    throw unprocessable(`Le montant du prêt dépasse ${pct(bam.ltvRatio)} % de la valeur du bien. Un apport minimum de ${pct(1 - bam.ltvRatio)} % est requis (réglementation BAM).`);
  }
}
function assertEligibleAge(currentAge: number, durationMonths: number, bam: BamParametersEntity): void {
  const ageAtMaturity = currentAge + Math.ceil(durationMonths / 12);
  if (ageAtMaturity > bam.maxAgeAtMaturity) {
    throw unprocessable("L'échéance du crédit dépasse l'âge maximum autorisé à l'échéance (réglementation BAM).");
  }
}
function assertWithinDebtRatio(allInMonthlyPayment: number, totalMonthlyIncome: number, bam: BamParametersEntity): void {
  const maxMonthly = calc.money(totalMonthlyIncome * bam.maxDebtRatio);
  if (allInMonthlyPayment > maxMonthly) {
    throw unprocessable(`La mensualité dépasse ${pct(bam.maxDebtRatio)} % du revenu mensuel déclaré (réglementation BAM).`);
  }
}

export const simulationRoutes = [
  { method: 'POST', pattern: '/mortgage-credit', handler: simulateMortgage },
  { method: 'POST', pattern: '/investment-credit', handler: simulateInvestment },
];
