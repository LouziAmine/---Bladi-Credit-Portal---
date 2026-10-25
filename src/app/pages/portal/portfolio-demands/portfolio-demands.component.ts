import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClientPortfolioService } from '../../../core/services/client-portfolio-service/client-portfolio.service';
import { ClientDemandSummaryResponse } from '../../../core/models/enterprise-user-link.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { formatAmount } from '../../../core/utils/format.utils';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-portfolio-demands',
  imports: [DatePipe, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './portfolio-demands.component.html',
  styleUrl: './portfolio-demands.component.css',
})
export class PortfolioDemandsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly portfolioService = inject(ClientPortfolioService);

  protected readonly enterpriseId = this.route.snapshot.paramMap.get('enterpriseId')!;

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly demands = signal<ClientDemandSummaryResponse[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly total = signal(0);

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.portfolioService.getPortfolioDemands(this.enterpriseId, page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.demands.set(result.items);
        this.currentPage.set(result.currentPage);
        this.lastPage.set(result.lastPage);
        this.total.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'portal.demands.loadErrorFallback'));
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
}
