export interface CreditRateResponse {
  id: number;
  cspCode: string;
  rateMin: number;
  rateMax: number;
  minDurationMonths: number;
  maxDurationMonths: number;
  active: boolean;
}

export interface PatchCreditRateRequest {
  rateMin?: number;
  rateMax?: number;
  minDurationMonths?: number;
  maxDurationMonths?: number;
  active?: boolean;
}
