import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientPortfolioService } from '../../../core/services/client-portfolio-service/client-portfolio.service';
import {
  ENTERPRISE_LINK_ROLE_OPTIONS,
  ClientDemandSummaryResponse,
  ClientPortfolioEnterpriseResponse,
  EnterpriseLinkRole,
  EnterpriseUserLinkResponse,
} from '../../../core/models/enterprise-user-link.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { formatAmount } from '../../../core/utils/format.utils';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-portfolio',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './portfolio.component.html',
})
export class PortfolioComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly portfolioService = inject(ClientPortfolioService);
  private readonly translate = inject(TranslateService);

  protected readonly roleOptions = ENTERPRISE_LINK_ROLE_OPTIONS;

  protected readonly claiming = signal(false);
  protected readonly claimErrorMessage = signal<string | null>(null);
  protected readonly claimSuccessMessage = signal<string | null>(null);

  protected readonly loadingLinks = signal(false);
  protected readonly linksErrorMessage = signal<string | null>(null);
  protected readonly myLinks = signal<EnterpriseUserLinkResponse[]>([]);

  protected readonly loadingPortfolio = signal(false);
  protected readonly portfolioErrorMessage = signal<string | null>(null);
  protected readonly portfolio = signal<ClientPortfolioEnterpriseResponse[]>([]);

  protected readonly loadingMortgages = signal(false);
  protected readonly mortgagesErrorMessage = signal<string | null>(null);
  protected readonly mortgages = signal<ClientDemandSummaryResponse[]>([]);

  readonly formatAmount = formatAmount;

  protected readonly claimForm = this.fb.nonNullable.group({
    registrationNumber: ['', [Validators.required, Validators.maxLength(50)]],
    role: ['RESPONSABLE' as EnterpriseLinkRole, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadMyLinks();
    this.loadPortfolio();
    this.loadMortgages();
  }

  loadMortgages(): void {
    this.loadingMortgages.set(true);
    this.mortgagesErrorMessage.set(null);
    this.portfolioService.getMyMortgageDemands().subscribe({
      next: (mortgages) => {
        this.loadingMortgages.set(false);
        this.mortgages.set(mortgages);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingMortgages.set(false);
        this.mortgagesErrorMessage.set(this.apiErrors.describe(err, 'portal.mortgage.loadErrorFallback'));
      },
    });
  }

  loadMyLinks(): void {
    this.loadingLinks.set(true);
    this.linksErrorMessage.set(null);
    this.portfolioService.getMyEnterpriseLinks().subscribe({
      next: (links) => {
        this.loadingLinks.set(false);
        this.myLinks.set(links);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingLinks.set(false);
        this.linksErrorMessage.set(this.apiErrors.describe(err, 'portal.myLinks.loadErrorFallback'));
      },
    });
  }

  loadPortfolio(): void {
    this.loadingPortfolio.set(true);
    this.portfolioErrorMessage.set(null);
    this.portfolioService.getMyPortfolio().subscribe({
      next: (portfolio) => {
        this.loadingPortfolio.set(false);
        this.portfolio.set(portfolio);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPortfolio.set(false);
        this.portfolioErrorMessage.set(this.apiErrors.describe(err, 'portal.myPortfolio.loadErrorFallback'));
      },
    });
  }

  submitClaim(): void {
    if (this.claimForm.invalid) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.claiming.set(true);
    this.claimErrorMessage.set(null);
    this.claimSuccessMessage.set(null);

    const raw = this.claimForm.getRawValue();
    this.portfolioService.claimEnterprise(raw).subscribe({
      next: () => {
        this.claiming.set(false);
        this.claimSuccessMessage.set(this.translate.instant('portal.claim.success'));
        this.claimForm.reset({ registrationNumber: '', role: 'RESPONSABLE' });
        this.loadMyLinks();
      },
      error: (err: HttpErrorResponse) => {
        this.claiming.set(false);
        this.claimErrorMessage.set(this.apiErrors.describe(err, 'portal.claim.errorFallback'));
      },
    });
  }
}
