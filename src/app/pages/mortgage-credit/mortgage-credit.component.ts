import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MortgageCreditService } from '../../core/services/mortgage-credit-service/mortgage-credit.service';
import {
  CspCode,
  CSP_OPTIONS,
  ProductType,
  MortgageCreditRequest,
  MortgageCreditResponse,
} from '../../core/models/mortgage-credit.model';
import { MORTGAGE_LIMITS } from '../../core/models/simulation-limits.model';
import { ProductHighlightsComponent, ProductReason } from '../../shared/components/product-highlights/product-highlights.component';
import { MortgageSimulationResultComponent } from './mortgage-simulation-result/mortgage-simulation-result.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { formatDuration as formatDurationUtil, formatAmount, sliderFill } from '../../core/utils/format.utils';
import { ApiErrorMessageService } from '../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mortgage-credit',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe, ProductHighlightsComponent, MortgageSimulationResultComponent],
  templateUrl: './mortgage-credit.component.html',
  styleUrl: '../simulator-page.css',
})
export class MortgageCreditComponent {
  protected readonly reasons: ProductReason[] = [
    { key: 'digital', icon: 'bi-laptop' },
    { key: 'expertise', icon: 'bi-buildings' },
    { key: 'conventions', icon: 'bi-file-earmark-check' },
  ];
  protected readonly stepIcons = ['bi-calculator', 'bi-person-circle', 'bi-send', 'bi-folder2-open', 'bi-house-check'];

  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly mortgageCreditService = inject(MortgageCreditService);
  private readonly translate = inject(TranslateService);

  protected readonly cspOptions = CSP_OPTIONS;
  protected readonly limits = MORTGAGE_LIMITS;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<MortgageCreditResponse | null>(null);
  private readonly amountValue = signal(500000);
  private readonly durationValue = signal(240);

  protected readonly form = this.fb.nonNullable.group({
    applicantName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+212|0)[5-7]\d{8}$/)]],
    amount: [500000, [Validators.required, Validators.min(MORTGAGE_LIMITS.amount.min), Validators.max(MORTGAGE_LIMITS.amount.max)]],
    duration: [240, [Validators.required, Validators.min(MORTGAGE_LIMITS.duration.min),
      Validators.max(MORTGAGE_LIMITS.duration.max)]],
    cspCode: ['' as CspCode, [Validators.required]],
    productType: ['CONVENTIONAL' as ProductType, [Validators.required]],
    nationalityCode: [{ value: 'MA', disabled: true }],
    moroccanResident: [true, [Validators.required]],
    propertyValue: [600000, [Validators.required, Validators.min(MORTGAGE_LIMITS.propertyValue.min),
      Validators.max(MORTGAGE_LIMITS.propertyValue.max)]],
    monthlyIncome: [15000, [Validators.required, Validators.min(MORTGAGE_LIMITS.monthlyIncome.min),
      Validators.max(MORTGAGE_LIMITS.monthlyIncome.max)]],
    age: [35, [Validators.required, Validators.min(MORTGAGE_LIMITS.age.min), Validators.max(MORTGAGE_LIMITS.age.max)]],
    coBorrower: [false],
    coBorrowerMonthlyIncome: [0],
  });

  readonly formatAmount = formatAmount;

  formatDuration(months: number): string {
    return formatDurationUtil(
      months,
      this.translate.instant('mortgageCredit.form.years'),
      this.translate.instant('mortgageCredit.form.months'),
    );
  }

  protected readonly amountFill = computed(() => sliderFill(this.amountValue(), MORTGAGE_LIMITS.amount.min, MORTGAGE_LIMITS.amount.max));
  protected readonly durationFill = computed(() => sliderFill(this.durationValue(), MORTGAGE_LIMITS.duration.min, MORTGAGE_LIMITS.duration.max));

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    const raw = this.form.getRawValue();
    const request: MortgageCreditRequest = {
      applicantName: raw.applicantName,
      email: raw.email,
      phone: raw.phone,
      amount: raw.amount,
      duration: raw.duration,
      cspCode: raw.cspCode,
      productType: raw.productType,
      nationalityCode: raw.nationalityCode,
      moroccanResident: raw.moroccanResident,
      propertyValue: raw.propertyValue,
      monthlyIncome: raw.monthlyIncome,
      age: raw.age,
      coBorrower: raw.coBorrower,
      ...(raw.coBorrower ? { coBorrowerMonthlyIncome: raw.coBorrowerMonthlyIncome } : {}),
    };

    this.mortgageCreditService.simulate(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.result.set(response);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'mortgageCredit.errorFallback'));
      },
    });
  }

  reset(): void {
    this.form.reset({
      applicantName: '',
      email: '',
      phone: '',
      amount: 500000,
      duration: 240,
      cspCode: '' as CspCode,
      productType: 'CONVENTIONAL',
      nationalityCode: 'MA',
      moroccanResident: true,
      propertyValue: 600000,
      monthlyIncome: 15000,
      age: 35,
      coBorrower: false,
      coBorrowerMonthlyIncome: 0,
    });
    this.amountValue.set(500000);
    this.durationValue.set(240);
    this.result.set(null);
    this.errorMessage.set(null);
  }

  onAmountChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.form.controls.amount.setValue(val);
    this.amountValue.set(val);
  }

  onDurationChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.form.controls.duration.setValue(val);
    this.durationValue.set(val);
  }

}
