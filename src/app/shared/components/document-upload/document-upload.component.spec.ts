import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentService } from '../../../core/services/document-service/document.service';
import { DemandDocumentResponse } from '../../../core/models/document.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { CODE_ACTIVE, CODE_CLEAN, CODE_RISK_ANALYSIS_STEP } from '../../../testing/mocks/mock-codes';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';
import { FILE_BIG_PDF, FILE_NOTE_TXT, FILE_PIECE_IDENTITE_PDF } from '../../../testing/mocks/mock-files';
import { USER_MANAGER1 } from '../../../testing/mocks/mock-users';

describe('DocumentUploadComponent', () => {
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let componentRef: ComponentRef<DocumentUploadComponent>;
  let documentService: DocumentService;

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

  function createComponent(): void {
    fixture = TestBed.createComponent(DocumentUploadComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('demandId', 1);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    documentService = TestBed.inject(DocumentService);
    vi.spyOn(documentService, 'list').mockReturnValue(of([]));
  });

  it('should create and load documents for the given demand on init', () => {
    createComponent();

    expect(fixture.componentInstance).toBeTruthy();
    expect(documentService.list).toHaveBeenCalledWith(1);
  });

  it('should show empty state when no documents exist', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Aucun document pour ce dossier.');
  });

  it('should render the documents table when documents are returned', () => {
    vi.spyOn(documentService, 'list').mockReturnValue(of([mockDocument]));
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(FILE_PIECE_IDENTITE_PDF);
  });

  it('should reject a file exceeding the maximum size', () => {
    createComponent();
    const file = new File([new Uint8Array(16 * 1024 * 1024)], FILE_BIG_PDF, { type: 'application/pdf' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(fixture.componentInstance['selectedFile']()).toBeNull();
    expect(fixture.componentInstance['selectedFileError']()).toContain('taille maximale');
  });

  it('should reject a file type outside the whitelist', () => {
    createComponent();
    const file = new File(['not a pdf'], FILE_NOTE_TXT, { type: 'text/plain' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    expect(fixture.componentInstance['selectedFile']()).toBeNull();
    expect(fixture.componentInstance['selectedFileError']()).toContain('non autorisé');
  });

  it('should accept a valid file and upload it', () => {
    createComponent();
    vi.spyOn(documentService, 'upload').mockReturnValue(of(mockDocument));
    const file = new File(['%PDF-1.5'], FILE_PIECE_IDENTITE_PDF, { type: 'application/pdf' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });

    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);
    expect(fixture.componentInstance['selectedFile']()).toBe(file);

    fixture.componentInstance.upload();

    expect(documentService.upload).toHaveBeenCalledWith(1, file, undefined);
    expect(documentService.list).toHaveBeenCalledTimes(2);
  });

  it('should surface an error message when upload fails', () => {
    createComponent();
    const file = new File(['%PDF-1.5'], FILE_PIECE_IDENTITE_PDF, { type: 'application/pdf' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file] });
    fixture.componentInstance.onFileSelected({ target: input } as unknown as Event);

    const error = new HttpErrorResponse({ error: { description: 'Fichier trop volumineux.' }, status: 422 });
    vi.spyOn(documentService, 'upload').mockReturnValue(throwError(() => error));

    fixture.componentInstance.upload();

    expect(fixture.componentInstance['uploadErrorMessage']()).toBe('Fichier trop volumineux.');
  });
});
