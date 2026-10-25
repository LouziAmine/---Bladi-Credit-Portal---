export type RateFormula = 'MIN';

export interface CreditRateResponse {
  id: string;
  cspCode: string;
  rateMin: number;
  rateMax: number;
  rateFormula: RateFormula | null;
  minDurationMonths: number;
  maxDurationMonths: number;
  active: boolean;
}

export interface PatchCreditRateRequest {
  rateMin?: number;
  rateMax?: number;
  rateFormula?: RateFormula | null;
  minDurationMonths?: number;
  maxDurationMonths?: number;
  active?: boolean;
}
