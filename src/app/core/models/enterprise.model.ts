export interface EnterpriseResponse {
  id: string;
  name: string;
  sector: string | null;
  registrationNumber: string | null;
  createdAt: string;
}

export interface CreateEnterpriseRequest {
  name: string;
  sector?: string;
  registrationNumber?: string;
}

export interface EnterpriseMatchResponse {
  matched: boolean;
  enterprise: EnterpriseResponse | null;
}
