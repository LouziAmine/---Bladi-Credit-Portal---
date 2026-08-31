export const CSP_OPTIONS = ['SALA', 'FONC', 'RETR', 'PROF', 'INDE'] as const;
export type CspCode = (typeof CSP_OPTIONS)[number];

export type ProductType = 'CONVENTIONAL' | 'MOURABAHA';

export interface MortgageCreditRequest {
  applicantName: string;
  email: string;
  phone: string;
  amount: number;
  duration: number;
  cspCode: CspCode;
  productType?: ProductType;
  nationalityCode: string;
  moroccanResident: boolean;
  propertyValue: number;
  monthlyIncome: number;
  age: number;
  coBorrower?: boolean;
  coBorrowerMonthlyIncome?: number;
}

export interface AmortizationRow {
  installmentNumber: number;
  beginningBalance: number;
  interest: number | null;
  marginHt: number | null;
  vatOnMargin: number | null;
  marginTtc: number | null;
  principal: number;
  payment: number;
  endingBalance: number;
}

export interface ConventionalFinancingResponse {
  rateMin: number | null;
  rateMax: number | null;
  monthlyPayment: number | null;
  adiMonthlyPremium: number | null;
  allInMonthlyPayment: number | null;
  totalInterest: number | null;
  totalAdiCost: number | null;
  totalCost: number | null;
  monthlyPaymentMin: number | null;
  monthlyPaymentMax: number | null;
  adiMonthlyPremiumMin: number | null;
  adiMonthlyPremiumMax: number | null;
  allInMonthlyPaymentMin: number | null;
  allInMonthlyPaymentMax: number | null;
  totalInterestMin: number | null;
  totalInterestMax: number | null;
  totalAdiCostMin: number | null;
  totalAdiCostMax: number | null;
  totalCostMin: number | null;
  totalCostMax: number | null;
}

export interface MourabahaFinancingResponse {
  marginHt: number;
  vatOnMargin: number;
  marginTtc: number;
  monthlyPaymentTtc: number;
  takafulMonthlyContribution: number;
  allInMonthlyPaymentTtc: number;
  totalTakafulCost: number;
  totalCostTtc: number;
}

export interface MortgageCreditResponse {
  amount: number;
  duration: number;
  cspCode: CspCode;
  productType: ProductType;
  nationalityCode: string;
  moroccanResident: boolean;
  age: number;
  totalMonthlyIncome: number;
  applicableRate: number;
  taeg: number;
  registrationFees: number;
  landConservationFees: number;
  notaryFees: number;
  processingFees: number;
  totalFees: number;
  conventional: ConventionalFinancingResponse | null;
  mourabaha: MourabahaFinancingResponse | null;
  amortizationSchedule: AmortizationRow[];
  demandReference: string;
}
