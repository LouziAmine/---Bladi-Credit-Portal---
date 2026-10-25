import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../../core/services/document-service/document.service';
import { DocumentViewerService } from '../../../core/services/document-viewer-service/document-viewer.service';
import { DemandDocumentResponse } from '../../../core/models/document.model';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-document-upload',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './document-upload.component.html',
})
export class DocumentUploadComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly documentService = inject(DocumentService);
  private readonly documentViewerService = inject(DocumentViewerService);
  private readonly translate = inject(TranslateService);

  readonly demandId = input.required<string>();

  protected readonly form = this.fb.nonNullable.group({
    documentType: [''],
  });

  protected readonly documents = signal<DemandDocumentResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly uploadErrorMessage = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly selectedFileError = signal<string | null>(null);
  protected readonly viewingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.documentService.list(this.demandId()).subscribe({
      next: (documents) => {
        this.loading.set(false);
        this.documents.set(documents);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentUpload.loadErrorFallback'));
      },
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    this.selectedFileError.set(null);

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      this.selectedFile.set(null);
      this.selectedFileError.set(this.translate.instant('documentUpload.fileTooLarge'));
      target.value = '';
      return;
    }
    if (file && !ALLOWED_CONTENT_TYPES.includes(file.type)) {
      this.selectedFile.set(null);
      this.selectedFileError.set(this.translate.instant('documentUpload.fileTypeNotAllowed'));
      target.value = '';
      return;
    }
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    const documentType = this.form.getRawValue().documentType.trim() || undefined;

    this.uploading.set(true);
    this.uploadErrorMessage.set(null);

    this.documentService.upload(this.demandId(), file, documentType).subscribe({
      next: () => {
        this.uploading.set(false);
        this.selectedFile.set(null);
        this.form.reset({ documentType: '' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadErrorMessage.set(this.apiErrors.describe(err, 'documentUpload.uploadErrorFallback'));
      },
    });
  }

  view(doc: DemandDocumentResponse): void {
    this.viewingId.set(doc.id);
    this.documentViewerService.open(this.documentService.download(this.demandId(), doc.id)).subscribe({
      next: () => this.viewingId.set(null),
      error: () => {
        this.viewingId.set(null);
        this.errorMessage.set(this.translate.instant('documentUpload.viewErrorFallback'));
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} ${this.translate.instant('documentUpload.unit.bytes')}`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} ${this.translate.instant('documentUpload.unit.kilobytes')}`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${this.translate.instant('documentUpload.unit.megabytes')}`;
  }
}
