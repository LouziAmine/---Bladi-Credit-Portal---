export interface MourabahaParametersResponse {
  id: string;
  profitRate: number;
  vatRate: number;
  takafulMonthlyRate: number;
  active: boolean;
}

export interface PatchMourabahaParametersRequest {
  profitRate?: number;
  vatRate?: number;
  takafulMonthlyRate?: number;
  active?: boolean;
}
