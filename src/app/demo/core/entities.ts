export interface UserEntity {
  id: number;
  publicId: string;
  username: string;

  password: string;
  role: 'MANAGER' | 'CLIENT';
  fullName: string | null;
  email: string | null;
  gradeId: number | null;
  teamId: number | null;
}

export interface GradeEntity {
  id: number;
  publicId: string;
  code: string;
  name: string;
}

export interface TeamEntity {
  id: number;
  publicId: string;
  code: string;
  name: string;
}

export type RateFormula = 'MIN' | 'AVERAGE' | 'MAX';
export type EnterpriseType = 'TPE' | 'AUTO_ENTREPRENEUR' | 'PME' | 'ETI' | 'GE';

export interface CreditRateEntity {
  id: number;
  publicId: string;
  cspCode: string;
  rateMin: number;
  rateMax: number;
  rateFormula: RateFormula | null;
  minDurationMonths: number;
  maxDurationMonths: number;
  active: boolean;
  version: number;
}

export interface BamParametersEntity {
  id: number;
  publicId: string;
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
  active: boolean;
  version: number;
}

export interface MourabahaParametersEntity {
  id: number;
  publicId: string;
  profitRate: number;
  vatRate: number;
  takafulMonthlyRate: number;
  active: boolean;
  version: number;
}

export interface InvestmentCreditParametersEntity {
  id: number;
  publicId: string;
  enterpriseType: EnterpriseType;
  rateMin: number;
  rateMax: number;
  rateFormula: RateFormula | null;
  minCompanyAgeYears: number;
  maxFinancingToRevenueRatio: number;
  minGuaranteeCoverageRatio: number;
  maxDebtServiceRatio: number;
  processingFeesRatio: number;
  insurancePremiumRatio: number;
  active: boolean;
  version: number;
}

export interface ActivitySectorEntity {
  id: number;
  publicId: string;
  name: string;
  createdAt: string;
}

export interface DocumentSuggestionEntity {
  id: number;
  publicId: string;
  enterpriseType: EnterpriseType | null;
  cspCode: string | null;
  label: string;
  createdAt: string;
  clientScope: 'ENTERPRISE' | 'CSP';
}
