import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DocumentRequestService } from '../../../core/services/document-request-service/document-request.service';
import { DocumentService } from '../../../core/services/document-service/document.service';
import { DocumentViewerService } from '../../../core/services/document-viewer-service/document-viewer.service';
import { DocumentSuggestionService } from
  '../../../core/services/document-suggestion-service/document-suggestion.service';
import { DocumentRequestResponse } from '../../../core/models/document-request.model';
import { DocumentSuggestionResponse } from '../../../core/models/document-suggestion.model';
import { EnterpriseType } from '../../../core/models/investment-credit.model';
import { CspCode } from '../../../core/models/mortgage-credit.model';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-document-request-list',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe, DatePipe],
  templateUrl: './document-request-list.component.html',
})
export class DocumentRequestListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly documentRequestService = inject(DocumentRequestService);
  private readonly documentService = inject(DocumentService);
  private readonly documentViewerService = inject(DocumentViewerService);
  private readonly documentSuggestionService = inject(DocumentSuggestionService);
  private readonly translate = inject(TranslateService);

  readonly demandId = input.required<string>();
  readonly enterpriseType = input<EnterpriseType | null>(null);
  readonly cspCode = input<CspCode | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    documentType: ['', [Validators.required, Validators.maxLength(50)]],
  });

  protected readonly requests = signal<DocumentRequestResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitErrorMessage = signal<string | null>(null);
  protected readonly viewingId = signal<string | null>(null);

  protected readonly suggestions = signal<DocumentSuggestionResponse[]>([]);

  ngOnInit(): void {
    this.load();
    this.documentSuggestionService.getAll(this.enterpriseType(), this.cspCode()).subscribe({
      next: (suggestions) => this.suggestions.set(suggestions),
      error: () => this.suggestions.set([]),
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.documentRequestService.list(this.demandId()).subscribe({
      next: (requests) => {
        this.loading.set(false);
        this.requests.set(requests);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentRequests.admin.loadErrorFallback'));
      },
    });
  }

  view(documentId: string): void {
    this.viewingId.set(documentId);
    this.documentViewerService.open(this.documentService.download(this.demandId(), documentId)).subscribe({
      next: () => this.viewingId.set(null),
      error: () => {
        this.viewingId.set(null);
        this.errorMessage.set(this.translate.instant('documentRequests.admin.viewErrorFallback'));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.requestDocument(this.form.getRawValue().documentType.trim());
  }

  quickAdd(suggestion: DocumentSuggestionResponse): void {
    if (this.submitting() || this.isRequested(suggestion)) {
      return;
    }
    this.requestDocument(suggestion.label);
  }

  isRequested(suggestion: DocumentSuggestionResponse): boolean {
    const label = suggestion.label.trim().toLowerCase();
    return this.requests().some((r) => r.documentType.trim().toLowerCase() === label);
  }

  private requestDocument(documentType: string): void {
    this.submitting.set(true);
    this.submitErrorMessage.set(null);
    this.documentRequestService.create(this.demandId(), { documentType }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset({ documentType: '' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.submitErrorMessage.set(this.apiErrors.describe(err, 'documentRequests.admin.createErrorFallback'));
      },
    });
  }
}
