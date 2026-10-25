import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DemandService } from '../../../core/services/demand-service/demand.service';
import { EnterpriseService } from '../../../core/services/enterprise-service/enterprise.service';
import { DemandResponse, DemandSearchFilters, DemandStatus } from '../../../core/models/demand.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { formatAmount } from '../../../core/utils/format.utils';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demands',
  imports: [DatePipe, RouterLink, ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './demands.component.html',
  styleUrl: './demands.component.css',
})
export class DemandsComponent implements OnInit {
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly demandService = inject(DemandService);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly demands = signal<DemandResponse[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly total = signal(0);
  protected readonly enterpriseId = signal<string | null>(null);
  protected readonly enterpriseName = signal<string | null>(null);

  protected readonly searchForm = this.formBuilder.nonNullable.group({
    companyName: '',
    status: '' as '' | DemandStatus,
    minAmount: null as number | null,
    maxAmount: null as number | null,
  });

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    const rawId = this.route.snapshot.queryParamMap.get('enterpriseId');
    const enterpriseId = rawId;
    this.enterpriseId.set(enterpriseId);
    if (enterpriseId !== null) {
      this.enterpriseService.getById(enterpriseId).subscribe({
        next: (enterprise) => this.enterpriseName.set(enterprise.name),
      });
    }
    this.loadPage(1);

    this.searchForm.valueChanges.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadPage(1));
  }

  private buildFilters(): DemandSearchFilters | undefined {
    const { companyName, status, minAmount, maxAmount } = this.searchForm.getRawValue();
    const filters: DemandSearchFilters = {};
    const enterpriseId = this.enterpriseId();
    if (enterpriseId !== null) {
      filters.enterpriseId = enterpriseId;
    }
    if (companyName.trim()) {
      filters.companyName = companyName.trim();
    }
    if (status) {
      filters.status = status;
    }
    if (minAmount != null) {
      filters.minAmount = minAmount;
    }
    if (maxAmount != null) {
      filters.maxAmount = maxAmount;
    }
    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.demandService.getAll(page, PAGE_SIZE, this.buildFilters()).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.demands.set(result.items);
        this.currentPage.set(result.currentPage);
        this.lastPage.set(result.lastPage);
        this.total.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'demands.loadErrorFallback'));
      },
    });
  }

  resetFilters(): void {
    this.searchForm.reset({ companyName: '', status: '', minAmount: null, maxAmount: null });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.loadPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.loadPage(this.currentPage() + 1);
    }
  }
}
