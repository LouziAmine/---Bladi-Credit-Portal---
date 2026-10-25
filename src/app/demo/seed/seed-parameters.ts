import {
  BamParametersEntity,
  CreditRateEntity,
  InvestmentCreditParametersEntity,
  MourabahaParametersEntity,
} from '../core/entities';

export const SEED_CREDIT_RATES: CreditRateEntity[] = [
  { id: 1, cspCode: 'RETR', rateMin: 4.6, rateMax: 4.6, minDurationMonths: 12, maxDurationMonths: 240, active: true, version: 0, publicId: '59e386c8-16d5-45c2-89cf-7388e7f77aaf', rateFormula: 'MIN' },
  { id: 2, cspCode: 'SALA', rateMin: 5.0, rateMax: 5.5, minDurationMonths: 12, maxDurationMonths: 240, active: true, version: 0, publicId: '84fa3714-16cd-4b4d-82fe-4fddbb5c0d1f', rateFormula: 'AVERAGE' },
  { id: 3, cspCode: 'FONC', rateMin: 4.8, rateMax: 5.0, minDurationMonths: 12, maxDurationMonths: 300, active: true, version: 0, publicId: '2cda900c-1e68-4bd8-98f2-617cead71927', rateFormula: 'MIN' },
  { id: 4, cspCode: 'PROF', rateMin: 5.5, rateMax: 6.0, minDurationMonths: 12, maxDurationMonths: 180, active: true, version: 0, publicId: 'a41e7a3a-4001-45a4-8e65-11276834f3c3', rateFormula: 'MAX' },
  { id: 5, cspCode: 'INDE', rateMin: 6.0, rateMax: 6.5, minDurationMonths: 12, maxDurationMonths: 180, active: true, version: 0, publicId: '4c2c4f88-b2c2-4e15-940f-f5007e1fbcce', rateFormula: 'MAX' },
];

export const SEED_BAM_PARAMETERS: BamParametersEntity[] = [
  {
    id: 1,
    publicId: '8e1cb962-9407-41bb-94ea-c0469975c4c5',
    processingFeesRatio: 0.003,
    minProcessingFees: 3000.0,
    maxProcessingFees: 6000.0,
    registrationFeeRatio: 0.04,
    landConservationRatio: 0.015,
    notaryFeeRatio: 0.01,
    ltvRatio: 0.9,
    maxDebtRatio: 0.4,
    maxAgeAtMaturity: 75,
    adiMonthlyRate: 0.0004,
    active: true,
    version: 0,
  },
];

export const SEED_MOURABAHA_PARAMETERS: MourabahaParametersEntity[] = [
  {
    id: 1,
    publicId: '126c132a-4e10-41c5-ad3c-f2788b092a08',
    profitRate: 5.25,
    vatRate: 0.1,
    takafulMonthlyRate: 0.0004,
    active: true,
    version: 0,
  },
];

export const SEED_INVESTMENT_PARAMETERS: InvestmentCreditParametersEntity[] = [
  { id: 1, enterpriseType: 'PME', rateMin: 6.0, rateMax: 7.5, minCompanyAgeYears: 2, maxFinancingToRevenueRatio: 0.5, minGuaranteeCoverageRatio: 0.8, maxDebtServiceRatio: 0.4, processingFeesRatio: 0.01, insurancePremiumRatio: 0.001, active: true, version: 0, publicId: 'f965cdca-8f63-4bbb-b632-089ff2c298fb', rateFormula: 'AVERAGE' },
  { id: 2, enterpriseType: 'GE', rateMin: 5.0, rateMax: 6.5, minCompanyAgeYears: 3, maxFinancingToRevenueRatio: 0.7, minGuaranteeCoverageRatio: 0.6, maxDebtServiceRatio: 0.45, processingFeesRatio: 0.0075, insurancePremiumRatio: 0.0006, active: true, version: 0, publicId: '8b901acc-6dac-4536-96d4-2829e9a32270', rateFormula: 'AVERAGE' },
  { id: 3, enterpriseType: 'TPE', rateMin: 6.5, rateMax: 8.0, minCompanyAgeYears: 1, maxFinancingToRevenueRatio: 0.4, minGuaranteeCoverageRatio: 0.85, maxDebtServiceRatio: 0.35, processingFeesRatio: 0.011, insurancePremiumRatio: 0.0012, active: true, version: 0, publicId: '0c172552-d4ed-46e7-93cf-2661c5caa1f5', rateFormula: 'AVERAGE' },
  { id: 4, enterpriseType: 'AUTO_ENTREPRENEUR', rateMin: 7.5, rateMax: 9.0, minCompanyAgeYears: 0, maxFinancingToRevenueRatio: 0.3, minGuaranteeCoverageRatio: 0.9, maxDebtServiceRatio: 0.35, processingFeesRatio: 0.0125, insurancePremiumRatio: 0.0014, active: true, version: 0, publicId: '82f859c5-ef4b-4963-9680-a4b1dcbf34a6', rateFormula: 'AVERAGE' },
  { id: 5, enterpriseType: 'ETI', rateMin: 5.5, rateMax: 6.75, minCompanyAgeYears: 3, maxFinancingToRevenueRatio: 0.6, minGuaranteeCoverageRatio: 0.65, maxDebtServiceRatio: 0.425, processingFeesRatio: 0.0085, insurancePremiumRatio: 0.0008, active: true, version: 0, publicId: 'b7ccd618-b4de-4c01-a8bd-6b65140155b4', rateFormula: 'AVERAGE' },
];
