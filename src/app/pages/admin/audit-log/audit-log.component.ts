import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuditLogService } from '../../../core/services/audit-log-service/audit-log.service';
import { AuditLogEntry } from '../../../core/models/audit-log.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const PAGE_SIZE = 20;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-audit-log',
  imports: [DatePipe, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css',
})
export class AuditLogComponent implements OnInit {
  private readonly auditLogService = inject(AuditLogService);
  private readonly apiErrors = inject(ApiErrorMessageService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly entries = signal<AuditLogEntry[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly total = signal(0);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.auditLogService.getAll(page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.entries.set(result.items);
        this.currentPage.set(result.currentPage);
        this.lastPage.set(result.lastPage);
        this.total.set(result.total);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'auditLog.loadErrorFallback'));
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
