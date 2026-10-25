export type DocumentRequestStatus = 'PENDING' | 'FULFILLED';

export interface DocumentRequestResponse {
  id: string;
  demandId: string;
  documentType: string;
  status: DocumentRequestStatus;
  requestedByUsername: string;
  createdAt: string;
  fulfilledDocumentId: string | null;
  fulfilledAt: string | null;
}

export interface CreateDocumentRequestRequest {
  documentType: string;
}
