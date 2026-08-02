export type CspCode = 'RETR' | 'SALA' | 'FONC' | 'PROF' | 'INDE';

export interface CspOption {
  value: CspCode;
  label: string;
}

export const CSP_OPTIONS: CspOption[] = [
  { value: 'SALA', label: 'Salarié (SALA)' },
  { value: 'FONC', label: 'Fonctionnaire (FONC)' },
  { value: 'RETR', label: 'Retraité (RETR)' },
  { value: 'PROF', label: 'Profession libérale (PROF)' },
  { value: 'INDE', label: 'Indépendant (INDE)' },
];

export type ProductType = 'CONVENTIONAL' | 'MOURABAHA';

export interface SimulationRequest {
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

export interface SimulationResponse {
  amount: number;
  duration: number;
  cspCode: string;
  productType: ProductType;
  nationalityCode: string;
  moroccanResident: boolean;
  age: number;
  totalMonthlyIncome: number;

  applicableRate: number;
  rateMin: number | null;
  rateMax: number | null;

  monthlyPayment: number | null;
  adiMonthlyPremium: number | null;
  allInMonthlyPayment: number | null;
  totalInterest: number | null;
  totalAdiCost: number | null;
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

  totalCost: number;
  taeg: number;

  registrationFees: number;
  landConservationFees: number;
  notaryFees: number;
  processingFees: number;
  totalFees: number;

  marginHt: number | null;
  vatOnMargin: number | null;
  marginTtc: number | null;
  monthlyPaymentTtc: number | null;

  amortizationSchedule: AmortizationRow[];
}
