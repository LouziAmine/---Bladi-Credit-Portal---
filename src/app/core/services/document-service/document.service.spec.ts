import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DocumentService } from './document.service';
import { DemandDocumentResponse } from '../../models/document.model';
import { environment } from '../../../../environments/environment';
import { CODE_ACTIVE, CODE_CLEAN, CODE_RISK_ANALYSIS_STEP } from '../../../testing/mocks/mock-codes';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';
import { FILE_NOTE_PDF, FILE_PIECE_IDENTITE_PDF } from '../../../testing/mocks/mock-files';
import { USER_MANAGER1 } from '../../../testing/mocks/mock-users';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  const mockDocument: DemandDocumentResponse = {
    id: '1',
    stepCode: CODE_RISK_ANALYSIS_STEP,
    stepName: 'Contre-analyse du dossier de crédit',
    originalFilename: FILE_PIECE_IDENTITE_PDF,
    contentType: 'application/pdf',
    sizeBytes: 245678,
    checksumSha256: 'e3b0c4',
    documentType: "Pièce d'identité",
    status: CODE_ACTIVE,
    scanStatus: CODE_CLEAN,
    supersededByDocumentId: null,
    uploadedBy: USER_MANAGER1,
    uploadedAt: DATE_2026_08_01T10_00_00Z,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list documents for a demand', () => {
    service.list('1').subscribe((documents) => {
      expect(documents).toEqual([mockDocument]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/1/documents`);
    expect(req.request.method).toBe('GET');
    req.flush([mockDocument]);
  });

  it('should upload a file as multipart form data', () => {
    const file = new File(['%PDF-1.5'], FILE_PIECE_IDENTITE_PDF, { type: 'application/pdf' });

    service.upload('1', file, "Pièce d'identité").subscribe((document) => {
      expect(document).toEqual(mockDocument);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/1/documents`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const body = req.request.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('documentType')).toBe("Pièce d'identité");
    req.flush(mockDocument);
  });

  it('should omit documentType from the form data when not provided', () => {
    const file = new File(['%PDF-1.5'], FILE_NOTE_PDF, { type: 'application/pdf' });

    service.upload('1', file).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/1/documents`);
    const body = req.request.body as FormData;
    expect(body.get('documentType')).toBeNull();
    req.flush(mockDocument);
  });

  it('should download a document as a blob', () => {
    const blob = new Blob(['content'], { type: 'application/pdf' });

    service.download('1', '1').subscribe((result) => {
      expect(result).toBe(blob);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/1/documents/1/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });
});
