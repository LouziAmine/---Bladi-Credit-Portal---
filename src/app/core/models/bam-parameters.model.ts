export interface BamParametersResponse {
  id: number;
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
}

export interface PatchBamParametersRequest {
  processingFeesRatio?: number;
  minProcessingFees?: number;
  maxProcessingFees?: number;
  registrationFeeRatio?: number;
  landConservationRatio?: number;
  notaryFeeRatio?: number;
  ltvRatio?: number;
  maxDebtRatio?: number;
  maxAgeAtMaturity?: number;
  adiMonthlyRate?: number;
  active?: boolean;
}
