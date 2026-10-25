import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandService } from '../../../../../core/services/demand-service/demand.service';
import { ApiErrorMessageService } from
  '../../../../../core/services/api-error-message-service/api-error-message.service';
import { DemandAmortizationResponse, DemandHistoryEntryResponse } from '../../../../../core/models/demand.model';
import { formatAmount } from '../../../../../core/utils/format.utils';
import { SimulationDetailsComponent } from '../simulation-details/simulation-details.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-history',
  imports: [SimulationDetailsComponent, DatePipe, TranslatePipe],
  templateUrl: './demand-history.component.html',
})
export class DemandHistoryComponent {
  private readonly demandService = inject(DemandService);
  private readonly apiErrors = inject(ApiErrorMessageService);

  readonly demandId = input.required<string>();
  readonly history = input.required<DemandHistoryEntryResponse[]>();

  private readonly expandedHistoryRows = signal<Set<string>>(new Set());
  private readonly historyAmortization = signal<Map<string, DemandAmortizationResponse>>(new Map());
  private readonly historyAmortizationLoading = signal<Set<string>>(new Set());
  private readonly historyAmortizationError = signal<Map<string, string>>(new Map());

  readonly formatAmount = formatAmount;

  protected historyRowKey(entry: DemandHistoryEntryResponse): string {
    return entry.stepCode + entry.enteredAt;
  }

  protected canPreviewHistoryRow(entry: DemandHistoryEntryResponse): boolean {
    return entry.appliedRate !== null && entry.appliedAmount !== null && entry.appliedDuration !== null;
  }

  protected isHistoryRowExpanded(entry: DemandHistoryEntryResponse): boolean {
    return this.expandedHistoryRows().has(this.historyRowKey(entry));
  }

  protected historyRowAmortization(entry: DemandHistoryEntryResponse): DemandAmortizationResponse | null {
    return this.historyAmortization().get(this.historyRowKey(entry)) ?? null;
  }

  protected historyRowLoading(entry: DemandHistoryEntryResponse): boolean {
    return this.historyAmortizationLoading().has(this.historyRowKey(entry));
  }

  protected historyRowError(entry: DemandHistoryEntryResponse): string | null {
    return this.historyAmortizationError().get(this.historyRowKey(entry)) ?? null;
  }

  protected toggleHistoryRow(entry: DemandHistoryEntryResponse): void {
    const key = this.historyRowKey(entry);
    const expanded = new Set(this.expandedHistoryRows());
    if (expanded.delete(key)) {
      this.expandedHistoryRows.set(expanded);
      return;
    }
    expanded.add(key);
    this.expandedHistoryRows.set(expanded);

    if (this.historyAmortization().has(key) || this.historyAmortizationLoading().has(key)) {
      return;
    }
    this.historyAmortizationLoading.update((loading) => new Set(loading).add(key));

    this.demandService.getAmortizationSchedule(this.demandId(), {
      rate: entry.appliedRate!,
      amount: entry.appliedAmount!,
      duration: entry.appliedDuration!,
    }).subscribe({
      next: (result) => {
        this.stopLoading(key);
        this.historyAmortization.update((results) => new Map(results).set(key, result));
      },
      error: (err: HttpErrorResponse) => {
        this.stopLoading(key);
        const message = this.apiErrors.describe(err, 'demandDetail.scheduleErrorFallback');
        this.historyAmortizationError.update((errors) => new Map(errors).set(key, message));
      },
    });
  }

  private stopLoading(key: string): void {
    this.historyAmortizationLoading.update((loading) => {
      const next = new Set(loading);
      next.delete(key);
      return next;
    });
  }
}
