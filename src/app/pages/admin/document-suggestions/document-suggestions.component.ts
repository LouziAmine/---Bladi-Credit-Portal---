import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DocumentSuggestionService } from
  '../../../core/services/document-suggestion-service/document-suggestion.service';
import {
  CreateDocumentSuggestionRequest,
  DocumentSuggestionResponse,
} from '../../../core/models/document-suggestion.model';
import { ENTERPRISE_TYPE_OPTIONS, EnterpriseType } from '../../../core/models/investment-credit.model';
import { CSP_OPTIONS, CspCode } from '../../../core/models/mortgage-credit.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

function toScope(scope: string): Omit<CreateDocumentSuggestionRequest, 'label'> {
  const [kind, value] = scope.split(':');
  if (kind === 'CSP') {
    return { enterpriseType: null, cspCode: value as CspCode };
  }
  return { enterpriseType: kind === 'ENTERPRISE' ? (value as EnterpriseType) : null };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-document-suggestions',
  imports: [DatePipe, ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './document-suggestions.component.html',
})
export class DocumentSuggestionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly documentSuggestionService = inject(DocumentSuggestionService);
  private readonly translate = inject(TranslateService);

  protected readonly enterpriseTypeOptions = ENTERPRISE_TYPE_OPTIONS;
  protected readonly cspOptions = CSP_OPTIONS;

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly suggestions = signal<DocumentSuggestionResponse[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    scope: [''],
    label: ['', [Validators.required, Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.loadSuggestions();
  }

  loadSuggestions(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.documentSuggestionService.getAll().subscribe({
      next: (suggestions) => {
        this.loadingList.set(false);
        this.suggestions.set(suggestions);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentSuggestions.loadErrorFallback'));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.getRawValue();
    this.documentSuggestionService.create({ ...toScope(raw.scope), label: raw.label }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.translate.instant('documentSuggestions.addSuccess'));
        this.form.reset({ scope: '', label: '' });
        this.loadSuggestions();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentSuggestions.addErrorFallback'));
      },
    });
  }

  delete(id: string): void {
    this.deletingId.set(id);
    this.errorMessage.set(null);
    this.documentSuggestionService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.loadSuggestions();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentSuggestions.deleteErrorFallback'));
      },
    });
  }
}
