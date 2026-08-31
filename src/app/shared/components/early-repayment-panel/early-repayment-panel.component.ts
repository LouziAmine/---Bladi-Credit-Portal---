import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { EarlyRepaymentService } from '../../../core/services/early-repayment-service/early-repayment.service';
import {
  EarlyRepaymentQuoteResponse,
  EarlyRepaymentResponse,
} from '../../../core/models/early-repayment.model';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { formatAmount } from '../../../core/utils/format.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-early-repayment-panel',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe, DatePipe],
  templateUrl: './early-repayment-panel.component.html',
})
export class EarlyRepaymentPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly earlyRepaymentService = inject(EarlyRepaymentService);
  private readonly apiErrors = inject(ApiErrorMessageService);

  readonly demandId = input.required<string>();
  readonly mode = input<'CLIENT' | 'MANAGER'>('CLIENT');
  readonly repaid = output<EarlyRepaymentResponse>();

  protected readonly form = this.fb.group({
    amount: [null as number | null, [Validators.min(0.01)]],
  });

  protected readonly quote = signal<EarlyRepaymentQuoteResponse | null>(null);
  protected readonly quotedAmount = signal<number | null>(null);
  protected readonly history = signal<EarlyRepaymentResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly recording = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    if (this.mode() === 'MANAGER') {
      this.loadHistory();
    }
  }

  requestQuote(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const amount = this.form.getRawValue().amount;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.quote.set(null);
    this.earlyRepaymentService.quote(this.demandId(), amount, this.mode() === 'CLIENT').subscribe({
      next: (quote) => {
        this.loading.set(false);
        this.quote.set(quote);
        this.quotedAmount.set(amount);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'earlyRepayment.quoteErrorFallback'));
      },
    });
  }

  record(): void {
    const amount = this.quotedAmount();
    this.recording.set(true);
    this.errorMessage.set(null);
    this.earlyRepaymentService.repay(this.demandId(), amount != null ? { amount } : {}).subscribe({
      next: (repayment) => {
        this.recording.set(false);
        this.quote.set(null);
        this.form.reset({ amount: null });
        this.loadHistory();
        this.repaid.emit(repayment);
      },
      error: (err: HttpErrorResponse) => {
        this.recording.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'earlyRepayment.recordErrorFallback'));
      },
    });
  }

  private loadHistory(): void {
    this.earlyRepaymentService.history(this.demandId()).subscribe({
      next: (history) => this.history.set(history),
      error: () => this.history.set([]),
    });
  }
}
