import { EnterpriseType } from './investment-credit.model';
import { RateFormula } from './credit-rate.model';

export interface InvestmentCreditParametersResponse {
  id: string;
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
}

export interface PatchInvestmentCreditParametersRequest {
  rateMin?: number;
  rateMax?: number;
  rateFormula?: RateFormula | null;
  minCompanyAgeYears?: number;
  maxFinancingToRevenueRatio?: number;
  minGuaranteeCoverageRatio?: number;
  maxDebtServiceRatio?: number;
  processingFeesRatio?: number;
  insurancePremiumRatio?: number;
  active?: boolean;
}
