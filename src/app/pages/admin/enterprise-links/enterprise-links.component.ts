import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EnterpriseUserLinkService } from '../../../core/services/enterprise-user-link-service/enterprise-user-link.service';
import { EnterpriseService } from '../../../core/services/enterprise-service/enterprise.service';
import {
  ENTERPRISE_LINK_ROLE_OPTIONS,
  EnterpriseLinkRole,
  EnterpriseUserLinkResponse,
} from '../../../core/models/enterprise-user-link.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-enterprise-links',
  imports: [DatePipe, ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './enterprise-links.component.html',
})
export class EnterpriseLinksComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly linkService = inject(EnterpriseUserLinkService);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly translate = inject(TranslateService);

  protected readonly roleOptions = ENTERPRISE_LINK_ROLE_OPTIONS;

  protected readonly enterpriseId = signal<string | null>(null);
  protected readonly enterpriseName = signal<string | null>(null);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly loadingPending = signal(false);
  protected readonly pendingErrorMessage = signal<string | null>(null);
  protected readonly pendingLinks = signal<EnterpriseUserLinkResponse[]>([]);
  protected readonly pendingCurrentPage = signal(1);
  protected readonly pendingLastPage = signal(1);
  protected readonly pendingTotal = signal(0);

  protected readonly loadingEnterpriseLinks = signal(false);
  protected readonly enterpriseLinksErrorMessage = signal<string | null>(null);
  protected readonly enterpriseLinks = signal<EnterpriseUserLinkResponse[]>([]);
  protected readonly enterpriseLinksCurrentPage = signal(1);
  protected readonly enterpriseLinksLastPage = signal(1);
  protected readonly enterpriseLinksTotal = signal(0);

  protected readonly actingLinkId = signal<string | null>(null);
  protected readonly rejectingLinkId = signal<string | null>(null);

  protected readonly rejectReasonControl = this.fb.nonNullable.control('');

  protected readonly inviteForm = this.fb.nonNullable.group({
    enterpriseId: [null as string | null, [Validators.required]],
    username: ['', [Validators.required]],
    role: ['RESPONSABLE' as EnterpriseLinkRole, [Validators.required]],
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.queryParamMap.get('enterpriseId');
    const enterpriseId = rawId;
    this.enterpriseId.set(enterpriseId);
    if (enterpriseId !== null) {
      this.inviteForm.patchValue({ enterpriseId });
      this.enterpriseService.getById(enterpriseId).subscribe({
        next: (enterprise) => this.enterpriseName.set(enterprise.name),
      });
      this.loadEnterpriseLinks(1);
    }
    this.loadPendingLinks(1);
  }

  loadPendingLinks(page: number): void {
    this.loadingPending.set(true);
    this.pendingErrorMessage.set(null);
    this.linkService.getPendingLinks(page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.loadingPending.set(false);
        this.pendingLinks.set(result.items);
        this.pendingCurrentPage.set(result.currentPage);
        this.pendingLastPage.set(result.lastPage);
        this.pendingTotal.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPending.set(false);
        this.pendingErrorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.pending.loadErrorFallback'));
      },
    });
  }

  previousPendingPage(): void {
    if (this.pendingCurrentPage() > 1) {
      this.loadPendingLinks(this.pendingCurrentPage() - 1);
    }
  }

  nextPendingPage(): void {
    if (this.pendingCurrentPage() < this.pendingLastPage()) {
      this.loadPendingLinks(this.pendingCurrentPage() + 1);
    }
  }

  loadEnterpriseLinks(page: number): void {
    const enterpriseId = this.enterpriseId();
    if (enterpriseId === null) {
      return;
    }
    this.loadingEnterpriseLinks.set(true);
    this.enterpriseLinksErrorMessage.set(null);
    this.linkService.getLinksForEnterprise(enterpriseId, page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.loadingEnterpriseLinks.set(false);
        this.enterpriseLinks.set(result.items);
        this.enterpriseLinksCurrentPage.set(result.currentPage);
        this.enterpriseLinksLastPage.set(result.lastPage);
        this.enterpriseLinksTotal.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingEnterpriseLinks.set(false);
        this.enterpriseLinksErrorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.forEnterprise.loadErrorFallback'));
      },
    });
  }

  previousEnterpriseLinksPage(): void {
    if (this.enterpriseLinksCurrentPage() > 1) {
      this.loadEnterpriseLinks(this.enterpriseLinksCurrentPage() - 1);
    }
  }

  nextEnterpriseLinksPage(): void {
    if (this.enterpriseLinksCurrentPage() < this.enterpriseLinksLastPage()) {
      this.loadEnterpriseLinks(this.enterpriseLinksCurrentPage() + 1);
    }
  }

  private reloadAfterAction(link: EnterpriseUserLinkResponse): void {
    this.loadPendingLinks(this.pendingCurrentPage());
    if (this.enterpriseId() === link.enterpriseId) {
      this.loadEnterpriseLinks(this.enterpriseLinksCurrentPage());
    }
  }

  approve(link: EnterpriseUserLinkResponse): void {
    this.actingLinkId.set(link.id);
    this.pendingErrorMessage.set(null);
    this.linkService.approve(link.id).subscribe({
      next: (updated) => {
        this.actingLinkId.set(null);
        this.reloadAfterAction(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.actingLinkId.set(null);
        this.pendingErrorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.pending.approveErrorFallback'));
      },
    });
  }

  startReject(link: EnterpriseUserLinkResponse): void {
    this.rejectingLinkId.set(link.id);
    this.rejectReasonControl.setValue('');
  }

  cancelReject(): void {
    this.rejectingLinkId.set(null);
  }

  confirmReject(link: EnterpriseUserLinkResponse): void {
    this.actingLinkId.set(link.id);
    this.pendingErrorMessage.set(null);
    const reason = this.rejectReasonControl.value.trim();
    this.linkService.reject(link.id, reason ? { reason } : {}).subscribe({
      next: (updated) => {
        this.actingLinkId.set(null);
        this.rejectingLinkId.set(null);
        this.reloadAfterAction(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.actingLinkId.set(null);
        this.pendingErrorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.pending.rejectErrorFallback'));
      },
    });
  }

  revoke(link: EnterpriseUserLinkResponse): void {
    this.actingLinkId.set(link.id);
    this.enterpriseLinksErrorMessage.set(null);
    this.linkService.revoke(link.id).subscribe({
      next: (updated) => {
        this.actingLinkId.set(null);
        this.reloadAfterAction(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.actingLinkId.set(null);
        this.enterpriseLinksErrorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.forEnterprise.revokeErrorFallback'));
      },
    });
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.inviteForm.getRawValue();
    this.linkService.inviteClient(raw.enterpriseId!, { username: raw.username, role: raw.role }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.translate.instant('enterpriseLinks.invite.success', { username: raw.username }));
        this.inviteForm.patchValue({ username: '', role: 'RESPONSABLE' });
        this.loadPendingLinks(1);
        if (this.enterpriseId() === raw.enterpriseId) {
          this.loadEnterpriseLinks(1);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'enterpriseLinks.invite.errorFallback'));
      },
    });
  }
}
