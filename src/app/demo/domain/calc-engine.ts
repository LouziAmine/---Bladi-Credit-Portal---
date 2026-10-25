import { AmortizationRow } from '../../core/models/mortgage-credit.model';
import { RateFormula } from '../core/entities';

export function roundHalfUp(value: number, scale: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = Math.pow(10, scale);

  const scaled = value * factor;
  const corrected = scaled + (scaled >= 0 ? 1 : -1) * 1e-9;
  return Math.round(corrected) / factor;
}

export function money(value: number): number {
  return roundHalfUp(value, 2);
}

export function applyRateFormula(rateMin: number, rateMax: number, formula: RateFormula | null): number {
  switch (formula) {
    case 'MIN':
      return rateMin;
    case 'MAX':
      return rateMax;
    case 'AVERAGE':
    default:
      return roundHalfUp((rateMin + rateMax) / 2, 2);
  }
}

export function monthlyRateOf(annualRatePercent: number): number {
  return roundHalfUp(annualRatePercent / 1200, 10);
}

export function monthlyPayment(capital: number, annualRatePercent: number, months: number): number {
  if (months <= 0) {
    throw new Error(`months must be strictly positive: ${months}`);
  }
  const tm = monthlyRateOf(annualRatePercent);
  if (tm === 0) {
    return money(capital / months);
  }
  const factor = Math.pow(1 + tm, months);
  const payment = capital * ((tm * factor) / (factor - 1));
  return money(payment);
}

export function totalInterestCost(payment: number, months: number, capital: number): number {
  return money(payment * months - capital);
}

export function totalCost(payment: number, months: number): number {
  return money(payment * months);
}

export interface BamParams {
  processingFeesRatio: number;
  minProcessingFees: number;
  maxProcessingFees: number;
  registrationFeeRatio: number;
  landConservationRatio: number;
  notaryFeeRatio: number;
  ltvRatio: number;
  maxDebtRatio: number;
  maxAgeAtMaturity: number;
  adiMonthlyRate: number;
}

export function registrationFees(propertyValue: number, p: BamParams): number {
  return money(propertyValue * p.registrationFeeRatio);
}
export function landConservationFees(propertyValue: number, p: BamParams): number {
  return money(propertyValue * p.landConservationRatio);
}
export function notaryFees(propertyValue: number, p: BamParams): number {
  return money(propertyValue * p.notaryFeeRatio);
}
export function processingFees(capital: number, p: BamParams): number {
  const fees = money(capital * p.processingFeesRatio);
  if (fees < p.minProcessingFees) {
    return money(p.minProcessingFees);
  }
  if (fees > p.maxProcessingFees) {
    return money(p.maxProcessingFees);
  }
  return fees;
}
export function adiMonthlyPremium(capital: number, p: BamParams, coBorrower: boolean): number {
  return money(capital * p.adiMonthlyRate * (coBorrower ? 2 : 1));
}
export function totalAdiCost(premium: number, months: number): number {
  return money(premium * months);
}

interface BaseRow {
  installmentNumber: number;
  beginningBalance: number;
  interest: number;
  principal: number;
  payment: number;
  endingBalance: number;
}

export function generateSchedule(capital: number, monthlyRate: number, payment: number, months: number): BaseRow[] {
  const rows: BaseRow[] = [];
  let balance = capital;
  for (let n = 1; n <= months; n++) {
    const beginningBalance = balance;
    const interest = money(beginningBalance * monthlyRate);
    let principal: number;
    let rowPayment: number;
    if (n < months) {
      principal = money(payment - interest);
      rowPayment = payment;
    } else {
      principal = beginningBalance;
      rowPayment = money(principal + interest);
    }
    const endingBalance = money(beginningBalance - principal);
    rows.push({ installmentNumber: n, beginningBalance, interest, principal, payment: rowPayment, endingBalance });
    balance = endingBalance;
  }
  return rows;
}

function toConventionalRow(r: BaseRow): AmortizationRow {
  return {
    installmentNumber: r.installmentNumber,
    beginningBalance: r.beginningBalance,
    interest: r.interest,
    marginHt: null,
    vatOnMargin: null,
    marginTtc: null,
    principal: r.principal,
    payment: r.payment,
    endingBalance: r.endingBalance,
  };
}

export function calculateTaeg(capital: number, processing: number, totalMonthlyPayment: number, months: number): number {
  const netAmount = capital - processing;
  const payment = totalMonthlyPayment;
  let low = 0;
  let high = 1;
  let monthlyRate = 0;
  const tolerance = 1e-10;
  for (let i = 0; i < 200 && high - low > tolerance; i++) {
    monthlyRate = (low + high) / 2;
    const pv = presentValueOfPayments(payment, monthlyRate, months);
    if (pv > netAmount) {
      low = monthlyRate;
    } else {
      high = monthlyRate;
    }
  }
  const annualFactor = Math.pow(1 + monthlyRate, 12);
  return roundHalfUp((annualFactor - 1) * 100, 2);
}

function presentValueOfPayments(payment: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) {
    return payment * months;
  }
  const onePlus = 1 + monthlyRate;
  const discountFactor = 1 - 1 / Math.pow(onePlus, months);
  return payment * (discountFactor / monthlyRate);
}

export interface FinancialSnapshot {
  monthlyPayment: number;
  adiMonthlyPremium: number;
  allInMonthlyPayment: number;
  totalInterest: number;
  totalAdiCost: number;
  totalCost: number;
  registrationFees: number;
  landConservationFees: number;
  notaryFees: number;
  processingFees: number;
  totalFees: number;
}

export function computeConventionalAtRate(
  capital: number,
  propertyValue: number,
  annualRatePercent: number,
  months: number,
  p: BamParams,
  coBorrower: boolean,
): FinancialSnapshot {
  const mp = monthlyPayment(capital, annualRatePercent, months);
  const adi = adiMonthlyPremium(capital, p, coBorrower);
  const reg = registrationFees(propertyValue, p);
  const land = landConservationFees(propertyValue, p);
  const notary = notaryFees(propertyValue, p);
  const proc = processingFees(capital, p);
  return {
    monthlyPayment: mp,
    adiMonthlyPremium: adi,
    allInMonthlyPayment: money(mp + adi),
    totalInterest: totalInterestCost(mp, months, capital),
    totalAdiCost: totalAdiCost(adi, months),
    totalCost: totalCost(mp, months),
    registrationFees: reg,
    landConservationFees: land,
    notaryFees: notary,
    processingFees: proc,
    totalFees: money(reg + land + notary + proc),
  };
}

export function computeConventionalSchedule(capital: number, annualRatePercent: number, payment: number, months: number): AmortizationRow[] {
  return generateSchedule(capital, monthlyRateOf(annualRatePercent), payment, months).map(toConventionalRow);
}

export interface MourabahaParams {
  profitRate: number;
  vatRate: number;
  takafulMonthlyRate: number;
}

export interface MourabahaSnapshot {
  monthlyPaymentTtc: number;
  marginHt: number;
  vatOnMargin: number;
  marginTtc: number;
  totalCostTtc: number;
  registrationFees: number;
  landConservationFees: number;
  notaryFees: number;
  processingFees: number;
  totalFees: number;
  takafulMonthlyContribution: number;
  allInMonthlyPaymentTtc: number;
  totalTakafulCost: number;
}

export function computeMourabaha(
  capital: number,
  propertyValue: number,
  m: MourabahaParams,
  months: number,
  p: BamParams,
  coBorrower: boolean,
): MourabahaSnapshot {
  const ttcRate = m.profitRate * (1 + m.vatRate);
  const mpTtc = monthlyPayment(capital, ttcRate, months);
  const marginTtc = totalInterestCost(mpTtc, months, capital);
  const marginHt = roundHalfUp(marginTtc / (1 + m.vatRate), 2);
  const vatOnMargin = money(marginTtc - marginHt);
  const reg = registrationFees(propertyValue, p);
  const land = landConservationFees(propertyValue, p);
  const notary = notaryFees(propertyValue, p);
  const proc = processingFees(capital, p);
  const takaful = money(capital * m.takafulMonthlyRate * (coBorrower ? 2 : 1));
  return {
    monthlyPaymentTtc: mpTtc,
    marginHt,
    vatOnMargin,
    marginTtc,
    totalCostTtc: money(capital + marginTtc),
    registrationFees: reg,
    landConservationFees: land,
    notaryFees: notary,
    processingFees: proc,
    totalFees: money(reg + land + notary + proc),
    takafulMonthlyContribution: takaful,
    allInMonthlyPaymentTtc: money(mpTtc + takaful),
    totalTakafulCost: totalAdiCost(takaful, months),
  };
}

export function computeMourabahaSchedule(capital: number, m: MourabahaParams, months: number): AmortizationRow[] {
  const ttcRate = m.profitRate * (1 + m.vatRate);
  const base = generateSchedule(capital, monthlyRateOf(ttcRate), monthlyPayment(capital, ttcRate, months), months);
  return base.map((r) => {
    const marginTtc = r.interest;
    const marginHt = roundHalfUp(marginTtc / (1 + m.vatRate), 2);
    const vatOnMargin = money(marginTtc - marginHt);
    return {
      installmentNumber: r.installmentNumber,
      beginningBalance: r.beginningBalance,
      interest: null,
      marginHt,
      vatOnMargin,
      marginTtc,
      principal: r.principal,
      payment: r.payment,
      endingBalance: r.endingBalance,
    };
  });
}

export interface InvestmentParams {
  processingFeesRatio: number;
  insurancePremiumRatio: number;
}

export interface InvestmentSnapshot {
  monthlyPayment: number;
  annualDebtService: number;
  totalInterest: number;
  totalCost: number;
  processingFees: number;
  taeg: number;
  schedule: AmortizationRow[];
  insurancePremium: number;
  allInMonthlyPayment: number;
  totalInsuranceCost: number;
}

export function computeInvestmentAtRate(
  amount: number,
  annualRatePercent: number,
  duration: number,
  params: InvestmentParams,
): InvestmentSnapshot {
  const proc = money(amount * params.processingFeesRatio);
  const mp = monthlyPayment(amount, annualRatePercent, duration);
  const insurance = money(amount * params.insurancePremiumRatio);
  const allIn = money(mp + insurance);
  const schedule = generateSchedule(amount, monthlyRateOf(annualRatePercent), mp, duration).map(toConventionalRow);
  return {
    monthlyPayment: mp,
    annualDebtService: totalCost(mp, 12),
    totalInterest: totalInterestCost(mp, duration, amount),
    totalCost: totalCost(mp, duration),
    processingFees: proc,
    taeg: calculateTaeg(amount, proc, allIn, duration),
    schedule,
    insurancePremium: insurance,
    allInMonthlyPayment: allIn,
    totalInsuranceCost: totalAdiCost(insurance, duration),
  };
}
