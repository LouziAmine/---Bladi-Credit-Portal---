import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CreditFileService } from '../../../../../core/services/credit-file-service/credit-file.service';
import { ApiErrorMessageService } from
  '../../../../../core/services/api-error-message-service/api-error-message.service';
import { CreditFileResponse } from '../../../../../core/models/credit-file.model';
import { ProductType } from '../../../../../core/models/mortgage-credit.model';
import { formatAmount } from '../../../../../core/utils/format.utils';
import { ErrorMessageComponent } from '../../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EarlyRepaymentPanelComponent } from
  '../../../../../shared/components/early-repayment-panel/early-repayment-panel.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-credit-file',
  imports: [
    ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, EarlyRepaymentPanelComponent,
    DatePipe, TranslatePipe,
  ],
  templateUrl: './demand-credit-file.component.html',
})
export class DemandCreditFileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly creditFileService = inject(CreditFileService);
  private readonly apiErrors = inject(ApiErrorMessageService);

  readonly demandId = input.required<string>();
  readonly productType = input<ProductType | null>(null);

  protected readonly creditFile = signal<CreditFileResponse | null>(null);
  protected readonly loadingCreditFile = signal(false);
  protected readonly creditFileErrorMessage = signal<string | null>(null);
  protected readonly showInstallments = signal(false);
  protected readonly payingInstallmentId = signal<string | null>(null);
  protected readonly rejectingInstallmentId = signal<string | null>(null);
  protected readonly rejectPaymentReasonControl = this.fb.nonNullable.control('');

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadingCreditFile.set(true);
    this.creditFileErrorMessage.set(null);
    this.creditFileService.getByDemandIdForManager(this.demandId()).subscribe({
      next: (result) => {
        this.loadingCreditFile.set(false);
        this.creditFile.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingCreditFile.set(false);
        this.creditFileErrorMessage.set(this.apiErrors.describe(err, 'creditFile.admin.loadErrorFallback'));
      },
    });
  }

  toggleInstallments(): void {
    this.showInstallments.update((v) => !v);
  }

  validatePayment(installmentId: string): void {
    this.payingInstallmentId.set(installmentId);
    this.creditFileErrorMessage.set(null);
    this.creditFileService.validatePayment(this.demandId(), installmentId).subscribe({
      next: () => {
        this.payingInstallmentId.set(null);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.payingInstallmentId.set(null);
        this.creditFileErrorMessage.set(this.apiErrors.describe(err, 'creditFile.admin.validateErrorFallback'));
      },
    });
  }

  startRejectPayment(installmentId: string): void {
    this.rejectingInstallmentId.set(installmentId);
    this.rejectPaymentReasonControl.setValue('');
  }

  cancelRejectPayment(): void {
    this.rejectingInstallmentId.set(null);
  }

  confirmRejectPayment(installmentId: string): void {
    const reason = this.rejectPaymentReasonControl.value.trim();
    if (!reason) {
      this.rejectPaymentReasonControl.markAsTouched();
      return;
    }
    this.payingInstallmentId.set(installmentId);
    this.creditFileErrorMessage.set(null);
    this.creditFileService.rejectPayment(this.demandId(), installmentId, reason).subscribe({
      next: () => {
        this.payingInstallmentId.set(null);
        this.rejectingInstallmentId.set(null);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.payingInstallmentId.set(null);
        this.creditFileErrorMessage.set(this.apiErrors.describe(err, 'creditFile.admin.rejectErrorFallback'));
      },
    });
  }
}
