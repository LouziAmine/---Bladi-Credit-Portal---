export interface MourabahaParametersResponse {
  id: number;
  profitRate: number;
  vatRate: number;
  active: boolean;
}

export interface PatchMourabahaParametersRequest {
  profitRate?: number;
  vatRate?: number;
  active?: boolean;
}
