import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InvestmentCreditService } from '../../core/services/investment-credit-service/investment-credit.service';
import { ActivitySectorService } from '../../core/services/activity-sector-service/activity-sector.service';
import {
  ENTERPRISE_TYPE_OPTIONS,
  InvestmentCreditRequest,
  InvestmentCreditResponse,
  EnterpriseType,
} from '../../core/models/investment-credit.model';
import { ActivitySectorResponse } from '../../core/models/activity-sector.model';
import { INVESTMENT_LIMITS } from '../../core/models/simulation-limits.model';
import { ProductHighlightsComponent, ProductReason } from '../../shared/components/product-highlights/product-highlights.component';
import { InvestmentSimulationResultComponent } from './investment-simulation-result/investment-simulation-result.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { formatDuration as formatDurationUtil } from '../../core/utils/format.utils';
import { ApiErrorMessageService } from '../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-investment-credit',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe, ProductHighlightsComponent, InvestmentSimulationResultComponent],
  templateUrl: './investment-credit.component.html',
  styleUrl: '../simulator-page.css',
})
export class InvestmentCreditComponent implements OnInit {
  protected readonly reasons: ProductReason[] = [
    { key: 'digital', icon: 'bi-graph-up-arrow' },
    { key: 'expertise', icon: 'bi-briefcase' },
    { key: 'tracking', icon: 'bi-eye' },
  ];
  protected readonly stepIcons = ['bi-calculator', 'bi-clipboard-check', 'bi-search', 'bi-people-fill', 'bi-cash-coin'];

  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly investmentCreditService = inject(InvestmentCreditService);
  private readonly activitySectorService = inject(ActivitySectorService);
  private readonly translate = inject(TranslateService);

  protected readonly enterpriseTypeOptions = ENTERPRISE_TYPE_OPTIONS;
  protected readonly activitySectors = signal<ActivitySectorResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<InvestmentCreditResponse | null>(null);

  protected readonly limits = INVESTMENT_LIMITS;

  protected readonly form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required]],
    enterpriseType: ['' as EnterpriseType, [Validators.required]],
    sector: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+212|0)[5-7]\d{8}$/)]],
    amount: [1500000, [Validators.required, Validators.min(INVESTMENT_LIMITS.amount.min),
      Validators.max(INVESTMENT_LIMITS.amount.max)]],
    duration: [84, [Validators.required, Validators.min(INVESTMENT_LIMITS.duration.min),
      Validators.max(INVESTMENT_LIMITS.duration.max)]],
    annualRevenue: [8000000, [Validators.required, Validators.min(1), Validators.max(INVESTMENT_LIMITS.annualAmount.max)]],
    companyAgeYears: [5, [Validators.required, Validators.min(INVESTMENT_LIMITS.companyAgeYears.min),
      Validators.max(INVESTMENT_LIMITS.companyAgeYears.max)]],
    existingAnnualDebtService: [0, [Validators.min(0), Validators.max(INVESTMENT_LIMITS.annualAmount.max)]],
    netAnnualResult: [1200000, [Validators.required, Validators.min(1), Validators.max(INVESTMENT_LIMITS.annualAmount.max)]],
    guaranteesValue: [1000000, [Validators.required, Validators.min(0), Validators.max(INVESTMENT_LIMITS.annualAmount.max)]],
  });

  formatDuration(months: number): string {
    return formatDurationUtil(
      months,
      this.translate.instant('mortgageCredit.form.years'),
      this.translate.instant('mortgageCredit.form.months'),
    );
  }

  ngOnInit(): void {
    this.activitySectorService.getAll().subscribe({
      next: (sectors) => this.activitySectors.set(sectors),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    const raw = this.form.getRawValue();
    const request: InvestmentCreditRequest = {
      companyName: raw.companyName,
      enterpriseType: raw.enterpriseType,
      ...(raw.sector ? { sector: raw.sector } : {}),
      email: raw.email,
      phone: raw.phone,
      amount: raw.amount,
      duration: raw.duration,
      annualRevenue: raw.annualRevenue,
      companyAgeYears: raw.companyAgeYears,
      existingAnnualDebtService: raw.existingAnnualDebtService,
      netAnnualResult: raw.netAnnualResult,
      guaranteesValue: raw.guaranteesValue,
    };

    this.investmentCreditService.simulate(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.result.set(response);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'investmentCredit.errorFallback'));
      },
    });
  }

  reset(): void {
    this.form.reset({
      companyName: '',
      enterpriseType: '' as EnterpriseType,
      sector: '',
      email: '',
      phone: '',
      amount: 1500000,
      duration: 84,
      annualRevenue: 8000000,
      companyAgeYears: 5,
      existingAnnualDebtService: 0,
      netAnnualResult: 1200000,
      guaranteesValue: 1000000,
    });
    this.result.set(null);
    this.errorMessage.set(null);
  }

}
