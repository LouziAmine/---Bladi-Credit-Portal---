export type DocumentStatus = 'ACTIVE' | 'SUPERSEDED';

export type DocumentScanStatus = 'PENDING' | 'CLEAN' | 'SKIPPED';

export interface DemandDocumentResponse {
  id: string;
  stepCode: string;
  stepName: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  documentType: string | null;
  status: DocumentStatus;
  scanStatus: DocumentScanStatus;
  supersededByDocumentId: string | null;
  uploadedBy: string;
  uploadedAt: string;
}
