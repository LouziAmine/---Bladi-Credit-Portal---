import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientDocumentRequestService } from
  '../../../core/services/client-document-request-service/client-document-request.service';
import { DocumentViewerService } from '../../../core/services/document-viewer-service/document-viewer.service';
import { CreditFileService } from '../../../core/services/credit-file-service/credit-file.service';
import { DocumentRequestResponse } from '../../../core/models/document-request.model';
import { CreditFileResponse } from '../../../core/models/credit-file.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EarlyRepaymentPanelComponent } from
  '../../../shared/components/early-repayment-panel/early-repayment-panel.component';
import { formatAmount } from '../../../core/utils/format.utils';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';
import { ClientPortfolioService } from '../../../core/services/client-portfolio-service/client-portfolio.service';
import { ClientDemandSummaryResponse } from '../../../core/models/enterprise-user-link.model';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const NEXT_INSTALLMENTS_SHOWN = 12;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-portal-demand-detail',
  imports: [
    RouterLink, ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, EarlyRepaymentPanelComponent,
    TranslatePipe, DatePipe,
  ],
  templateUrl: './portal-demand-detail.component.html',
})
export class PortalDemandDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly fb = inject(FormBuilder);
  private readonly documentRequestService = inject(ClientDocumentRequestService);
  private readonly documentViewerService = inject(DocumentViewerService);
  private readonly creditFileService = inject(CreditFileService);
  private readonly portfolioService = inject(ClientPortfolioService);
  private readonly translate = inject(TranslateService);

  protected readonly enterpriseId = this.route.snapshot.paramMap.get('enterpriseId');
  protected readonly demandId = this.route.snapshot.paramMap.get('demandId')!;
  protected readonly backLink = this.enterpriseId ? ['/portal', this.enterpriseId, 'demands'] : ['/portal'];

  protected readonly summary = signal<ClientDemandSummaryResponse | null>(null);
  protected readonly requests = signal<DocumentRequestResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly uploadingId = signal<string | null>(null);
  protected readonly uploadErrorByRequestId = signal<Record<string, string>>({});
  protected readonly viewingId = signal<string | null>(null);

  protected readonly demandCompleted = signal(false);
  protected readonly creditFile = signal<CreditFileResponse | null>(null);
  protected readonly showAllInstallments = signal(false);
  protected readonly visibleInstallments = computed(() => {
    const installments = this.creditFile()?.installments ?? [];
    if (this.showAllInstallments()) {
      return installments;
    }
    return installments.filter((installment) => installment.status !== 'PAID' && installment.status !== 'REPAID_EARLY')
      .slice(0, NEXT_INSTALLMENTS_SHOWN);
  });
  protected readonly creditFileLoading = signal(false);
  protected readonly creditFileErrorMessage = signal<string | null>(null);
  protected readonly payingInstallmentId = signal<string | null>(null);
  protected readonly declaringInstallmentId = signal<string | null>(null);
  protected readonly sourceRibControl =
    this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]);

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    this.loadSummary();
    this.load();
    this.loadCreditFile();
  }

  loadSummary(): void {
    const myDemands = this.enterpriseId
      ? this.portfolioService.getPortfolioDemands(this.enterpriseId, 1, 50).pipe(map((page) => page.items))
      : this.portfolioService.getMyMortgageDemands();
    myDemands.subscribe({
      next: (demands) => this.summary.set(demands.find((demand) => demand.id === this.demandId) ?? null),
      error: () => this.summary.set(null),
    });
  }

  loadCreditFile(): void {
    this.creditFileLoading.set(true);
    this.creditFileErrorMessage.set(null);
    this.creditFileService.getByDemandId(this.demandId).subscribe({
      next: (creditFile) => {
        this.creditFileLoading.set(false);
        this.demandCompleted.set(true);
        this.creditFile.set(creditFile);
      },
      error: (err: HttpErrorResponse) => {
        this.creditFileLoading.set(false);
        if (err.status === 404) {
          this.demandCompleted.set(false);
          return;
        }
        this.demandCompleted.set(true);
        this.creditFileErrorMessage.set(this.apiErrors.describe(err, 'creditFile.client.loadErrorFallback'));
      },
    });
  }

  startDeclare(installmentId: string): void {
    this.declaringInstallmentId.set(installmentId);
    this.sourceRibControl.setValue(this.creditFile()?.clientRib ?? '');
  }

  cancelDeclare(): void {
    this.declaringInstallmentId.set(null);
  }

  confirmDeclare(installmentId: string): void {
    if (this.sourceRibControl.invalid) {
      this.sourceRibControl.markAsTouched();
      return;
    }
    this.payingInstallmentId.set(installmentId);
    const sourceRib = this.sourceRibControl.value.trim();
    this.creditFileService.payInstallment(this.demandId, installmentId, sourceRib).subscribe({
      next: () => {
        this.payingInstallmentId.set(null);
        this.declaringInstallmentId.set(null);
        this.loadCreditFile();
      },
      error: (err: HttpErrorResponse) => {
        this.payingInstallmentId.set(null);
        this.creditFileErrorMessage.set(this.apiErrors.describe(err, 'creditFile.client.payErrorFallback'));
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.documentRequestService.list(this.demandId).subscribe({
      next: (requests) => {
        this.loading.set(false);
        this.requests.set(requests);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'documentRequests.client.loadErrorFallback'));
      },
    });
  }

  onFileSelected(event: Event, requestId: string): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;
    this.clearUploadError(requestId);

    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.setUploadError(requestId, this.translate.instant('documentRequests.client.fileTooLarge'));
      target.value = '';
      return;
    }
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      this.setUploadError(requestId, this.translate.instant('documentRequests.client.fileTypeNotAllowed'));
      target.value = '';
      return;
    }

    this.uploadingId.set(requestId);
    this.documentRequestService.uploadForRequest(this.demandId, requestId, file).subscribe({
      next: () => {
        this.uploadingId.set(null);
        target.value = '';
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.uploadingId.set(null);
        target.value = '';
        this.setUploadError(requestId, this.apiErrors.describe(err, 'documentRequests.client.uploadErrorFallback'));
      },
    });
  }

  view(requestId: string): void {
    this.viewingId.set(requestId);
    this.documentViewerService.open(this.documentRequestService.downloadFulfilledDocument(this.demandId, requestId))
      .subscribe({
        next: () => this.viewingId.set(null),
        error: () => {
          this.viewingId.set(null);
          this.errorMessage.set(this.translate.instant('documentRequests.client.viewErrorFallback'));
        },
      });
  }

  private setUploadError(requestId: string, message: string): void {
    this.uploadErrorByRequestId.update((errors) => ({ ...errors, [requestId]: message }));
  }

  private clearUploadError(requestId: string): void {
    this.uploadErrorByRequestId.update((errors) => {
      const next = { ...errors };
      delete next[requestId];
      return next;
    });
  }
}
