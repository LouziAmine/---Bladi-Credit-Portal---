import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { EnterpriseService } from '../../../core/services/enterprise-service/enterprise.service';
import { ActivitySectorService } from '../../../core/services/activity-sector-service/activity-sector.service';
import { EnterpriseResponse } from '../../../core/models/enterprise.model';
import { ActivitySectorResponse } from '../../../core/models/activity-sector.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-enterprises',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './enterprises.component.html',
})
export class EnterprisesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly activitySectorService = inject(ActivitySectorService);
  private readonly translate = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly enterprises = signal<EnterpriseResponse[]>([]);
  protected readonly activitySectors = signal<ActivitySectorResponse[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly total = signal(0);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    registrationNumber: ['', [Validators.maxLength(50)]],
    sector: ['', [Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.loadPage(1);
    this.activitySectorService.getAll().subscribe({
      next: (sectors) => this.activitySectors.set(sectors),
    });
  }

  loadPage(page: number): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.enterpriseService.getAll(page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.loadingList.set(false);
        this.enterprises.set(result.items);
        this.currentPage.set(result.currentPage);
        this.lastPage.set(result.lastPage);
        this.total.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'enterprises.loadErrorFallback'));
      },
    });
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

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.value;
    this.enterpriseService.create({
      name: raw.name!,
      sector: raw.sector || undefined,
      registrationNumber: raw.registrationNumber?.trim() || undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.translate.instant('enterprises.createSuccess'));
        this.form.reset();
        this.loadPage(1);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'enterprises.createErrorFallback'));
      },
    });
  }
}
