import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandService } from '../../../../core/services/demand-service/demand.service';
import { ApiErrorMessageService } from '../../../../core/services/api-error-message-service/api-error-message.service';
import {
  DemandAmortizationResponse,
  DemandAssignmentHistoryEntryResponse,
  DemandCommentResponse,
  DemandHistoryEntryResponse,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandStepResponse,
} from '../../../../core/models/demand.model';
import { UserResponse } from '../../../../core/models/user.model';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { DocumentUploadComponent } from '../../../../shared/components/document-upload/document-upload.component';
import { DocumentRequestListComponent } from
  '../../../../shared/components/document-request-list/document-request-list.component';
import { DemandPipelineComponent } from './demand-pipeline/demand-pipeline.component';
import { SimulationDetailsComponent } from './simulation-details/simulation-details.component';
import { DemandSummaryComponent } from './demand-summary/demand-summary.component';
import { DemandCreditFileComponent } from './demand-credit-file/demand-credit-file.component';
import { DemandHistoryComponent } from './demand-history/demand-history.component';
import { DemandAssignmentHistoryComponent } from './demand-assignment-history/demand-assignment-history.component';
import { DemandCommentsComponent } from './demand-comments/demand-comments.component';
import { DemandStepActionsComponent } from './demand-step-actions/demand-step-actions.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-detail',
  imports: [
    RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, DemandPipelineComponent, DocumentUploadComponent,
    DocumentRequestListComponent, SimulationDetailsComponent, DemandSummaryComponent, DemandCreditFileComponent,
    DemandHistoryComponent, DemandAssignmentHistoryComponent, DemandCommentsComponent, DemandStepActionsComponent,
    TranslatePipe,
  ],
  templateUrl: './demand-detail.component.html',
})
export class DemandDetailComponent implements OnInit {
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly demandService = inject(DemandService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly demand = signal<DemandResponse | null>(null);
  protected readonly currentStep = signal<DemandStepResponse | null>(null);
  protected readonly history = signal<DemandHistoryEntryResponse[]>([]);
  protected readonly assignmentHistory = signal<DemandAssignmentHistoryEntryResponse[]>([]);
  protected readonly pipeline = signal<DemandPipelineStepResponse[]>([]);
  protected readonly eligibleAssignees = signal<UserResponse[]>([]);
  protected readonly nextEligibleAssignees = signal<UserResponse[]>([]);
  protected readonly previousEligibleAssignees = signal<UserResponse[]>([]);
  protected readonly comments = signal<DemandCommentResponse[]>([]);
  protected readonly amortization = signal<DemandAmortizationResponse | null>(null);
  protected readonly loadingAmortization = signal(false);
  protected readonly amortizationErrorMessage = signal<string | null>(null);
  protected readonly initialAmortization = signal<DemandAmortizationResponse | null>(null);
  protected readonly loadingInitialAmortization = signal(false);
  protected readonly initialAmortizationErrorMessage = signal<string | null>(null);
  protected readonly hasCurrentRate = computed(() => this.demand()?.applicableRate != null);

  ngOnInit(): void {
    this.load();
  }

  protected onStepChanged(): void {
    this.amortization.set(null);
    this.load();
  }

  private demandId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  load(): void {
    const id = this.demandId();
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      demand: this.demandService.getById(id),
      currentStep: this.demandService.getCurrentStep(id),
      history: this.demandService.getHistory(id),
      assignmentHistory: this.demandService.getAssignmentHistory(id),
      pipeline: this.demandService.getPipeline(id),
      eligibleAssignees: this.demandService.getEligibleAssignees(id),
      nextEligibleAssignees: this.demandService.getEligibleAssignees(id, 'NEXT'),
      previousEligibleAssignees: this.demandService.getEligibleAssignees(id, 'PREVIOUS'),
      comments: this.demandService.getComments(id),
    }).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.demand.set(result.demand);
        this.currentStep.set(result.currentStep);
        this.history.set(result.history);
        this.assignmentHistory.set(result.assignmentHistory);
        this.pipeline.set(result.pipeline);
        this.eligibleAssignees.set(result.eligibleAssignees);
        this.nextEligibleAssignees.set(result.nextEligibleAssignees);
        this.previousEligibleAssignees.set(result.previousEligibleAssignees);
        this.comments.set(result.comments);
        if (result.demand.applicableRate != null) {
          this.loadAmortizationSchedule();
        }
        this.loadInitialAmortizationSchedule(result.demand, result.history);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'demandDetail.loadErrorFallback'));
      },
    });
  }

  private loadAmortizationSchedule(): void {
    const id = this.demandId();
    this.loadingAmortization.set(true);
    this.amortizationErrorMessage.set(null);
    this.demandService.getAmortizationSchedule(id).subscribe({
      next: (result) => {
        this.loadingAmortization.set(false);
        this.amortization.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingAmortization.set(false);
        this.amortizationErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.scheduleErrorFallback'));
      },
    });
  }

  private loadInitialAmortizationSchedule(demand: DemandResponse, history: DemandHistoryEntryResponse[]): void {
    const firstDecisionStep = history.find((entry) => entry.rateOption != null);
    const rate = firstDecisionStep ? firstDecisionStep.previousRate : demand.applicableRate;
    const amount = firstDecisionStep ? firstDecisionStep.previousAmount : demand.amount;
    const duration = firstDecisionStep ? firstDecisionStep.previousDuration : demand.duration;

    if (rate == null || amount == null || duration == null) {
      this.initialAmortization.set(null);
      return;
    }

    this.loadingInitialAmortization.set(true);
    this.initialAmortizationErrorMessage.set(null);
    this.demandService.getAmortizationSchedule(this.demandId(), { rate, amount, duration }).subscribe({
      next: (result) => {
        this.loadingInitialAmortization.set(false);
        this.initialAmortization.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingInitialAmortization.set(false);
        this.initialAmortizationErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.initialSimulationErrorFallback'));
      },
    });
  }
}
