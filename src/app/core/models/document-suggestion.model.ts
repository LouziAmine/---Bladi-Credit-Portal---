import { EnterpriseType } from './investment-credit.model';
import { CspCode } from './mortgage-credit.model';

export interface DocumentSuggestionResponse {
  id: string;
  enterpriseType: EnterpriseType | null;
  cspCode: CspCode | null;
  label: string;
  createdAt: string;
}

export interface CreateDocumentSuggestionRequest {
  enterpriseType: EnterpriseType | null;
  cspCode?: CspCode | null;
  label: string;
}
