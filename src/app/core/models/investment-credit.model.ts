import { AmortizationRow } from './mortgage-credit.model';

export const ENTERPRISE_TYPE_OPTIONS = ['TPE', 'AUTO_ENTREPRENEUR', 'PME', 'ETI', 'GE'] as const;
export type EnterpriseType = (typeof ENTERPRISE_TYPE_OPTIONS)[number];

export interface InvestmentCreditRequest {
  companyName: string;
  enterpriseType: EnterpriseType;
  sector?: string;
  email: string;
  phone: string;
  amount: number;
  duration: number;
  annualRevenue: number;
  companyAgeYears: number;
  existingAnnualDebtService?: number;
  netAnnualResult: number;
  guaranteesValue: number;
}

export interface InvestmentCreditResponse {
  companyName: string;
  enterpriseType: EnterpriseType;
  sector: string | null;
  amount: number;
  duration: number;
  applicableRate: number;
  monthlyPayment: number;
  annualDebtService: number;
  totalInterest: number;
  totalCost: number;
  processingFees: number;
  taeg: number;
  demandReference: string;
  amortizationSchedule: AmortizationRow[];
}
