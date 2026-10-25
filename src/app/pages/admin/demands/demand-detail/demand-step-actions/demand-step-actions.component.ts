import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../../core/services/auth-service/auth.service';
import { DemandService } from '../../../../../core/services/demand-service/demand.service';
import { ApiErrorMessageService } from '../../../../../core/services/api-error-message-service/api-error-message.service';
import {
  AdvanceDemandRequest,
  AMOUNT_OPTION_CHOICES,
  CommitteeType,
  COMMITTEE_TYPE_OPTIONS,
  DecisionOutcome,
  DECISION_OUTCOME_OPTIONS,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandStepResponse,
  DURATION_OPTION_CHOICES,
  InsuranceCoverageType,
  INSURANCE_COVERAGE_TYPE_OPTIONS,
  KeepOrManualOption,
  RateOption,
  RATE_OPTION_CHOICES,
} from '../../../../../core/models/demand.model';
import { UserResponse } from '../../../../../core/models/user.model';
import { ErrorMessageComponent } from '../../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { BamVerificationPanelComponent } from
  '../../../../../shared/components/bam-verification-panel/bam-verification-panel.component';
import { DemandClassificationComponent } from '../demand-classification/demand-classification.component';

type StepActionMode = 'ASSIGN' | 'ADVANCE' | 'CLASSIFY' | 'COMMENT';

const DECISION_STEP_CODES = ['DECISION_STEP', 'MORTGAGE_DECISION_STEP'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-step-actions',
  imports: [
    ReactiveFormsModule, TranslatePipe, ErrorMessageComponent, LoadingSpinnerComponent, BamVerificationPanelComponent,
    DemandClassificationComponent, DatePipe,
  ],
  templateUrl: './demand-step-actions.component.html',
})
export class DemandStepActionsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly demandService = inject(DemandService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly demand = input.required<DemandResponse>();
  readonly currentStep = input.required<DemandStepResponse>();
  readonly pipeline = input<DemandPipelineStepResponse[]>([]);
  readonly eligibleAssignees = input<UserResponse[]>([]);
  readonly nextEligibleAssignees = input<UserResponse[]>([]);
  readonly previousEligibleAssignees = input<UserResponse[]>([]);
  readonly changed = output<void>();

  protected readonly decisionOutcomeOptions = DECISION_OUTCOME_OPTIONS;
  protected readonly committeeTypeOptions = COMMITTEE_TYPE_OPTIONS;
  protected readonly insuranceCoverageTypeOptions = INSURANCE_COVERAGE_TYPE_OPTIONS;
  protected readonly rateOptionChoices = RATE_OPTION_CHOICES;
  protected readonly amountOptionChoices = AMOUNT_OPTION_CHOICES;
  protected readonly durationOptionChoices = DURATION_OPTION_CHOICES;

  protected readonly advancing = signal(false);
  protected readonly assigning = signal(false);
  protected readonly commenting = signal(false);
  protected readonly advanceErrorMessage = signal<string | null>(null);
  protected readonly assignErrorMessage = signal<string | null>(null);
  protected readonly commentErrorMessage = signal<string | null>(null);
  protected readonly actionMode = signal<StepActionMode>('ADVANCE');

  protected readonly form = this.fb.group({
    note: [''],
    decisionOutcome: ['' as DecisionOutcome | ''],
    returnReasonCode: [''],
    recommendations: [''],
    reserves: [''],
    committeeType: ['' as CommitteeType | ''],
    insuranceAdiSubscribed: [false],
    insuranceCoverageType: ['' as InsuranceCoverageType | ''],
    insuranceDamageSubscribed: [false],
    assigneeUsername: [''],
    rateOption: ['' as RateOption | ''],
    manualRate: [null as number | null],
    amountOption: ['' as KeepOrManualOption | ''],
    manualAmount: [null as number | null],
    durationOption: ['' as KeepOrManualOption | ''],
    manualDuration: [null as number | null],
  });

  protected readonly assignForm = this.fb.nonNullable.group({
    username: [''],
  });

  protected readonly commentForm = this.fb.nonNullable.group({
    comment: [''],
  });

  protected readonly isEnterpriseDemand = computed(() => this.demand().demandType === 'ENTERPRISE');
  protected readonly isClassificationStep = computed(() => this.currentStep().stepCode === 'CLASSIFICATION_STEP');
  protected readonly isDecisionStep = computed(() => DECISION_STEP_CODES.includes(this.currentStep().stepCode));
  protected readonly isCommitteeProgStep = computed(() => this.currentStep().stepCode === 'RISK_COMMITTEE_PROG_STEP');
  protected readonly isInsuranceStep = computed(() => this.currentStep().stepCode === 'INSURANCE_VALIDATION_STEP');
  protected readonly hasCurrentRate = computed(() => this.demand().applicableRate != null);
  protected readonly hasRealGuarantees = computed(() => (this.demand().enterprise?.guaranteesValue ?? 0) > 0);
  protected readonly currentUsername = computed(() => this.authService.getCurrentUsername());

  protected readonly isAtFirstStep = computed(() => {
    const steps = this.pipeline();
    return steps.length > 0 && steps[0].status === 'CURRENT';
  });

  protected readonly isLastStep = computed(() => {
    const steps = this.pipeline();
    return steps.length > 0 && steps[steps.length - 1].status === 'CURRENT';
  });

  protected readonly assignedFullName = computed(() => {
    const username = this.currentStep().assignedUsername;
    if (!username) {
      return null;
    }
    return this.eligibleAssignees().find((u) => u.username === username)?.fullName ?? null;
  });

  constructor() {
    effect(() => {
      const step = this.currentStep();
      const demand = this.demand();
      this.pipeline();
      untracked(() => this.adaptToStep(step, demand));
    });
  }

  protected setActionMode(mode: StepActionMode): void {
    this.actionMode.set(mode);
  }

  protected onSubmit(): void {
    switch (this.actionMode()) {
      case 'ASSIGN':
        this.assign();
        break;
      case 'COMMENT':
        this.addComment();
        break;
      default:
        this.advance();
    }
  }

  protected willReturnDossier(): boolean {
    return !!this.form.value.returnReasonCode?.trim();
  }

  protected selectedRateOptionDescription(): string | null {
    return this.optionDescription('rateOption', this.form.value.rateOption);
  }

  protected selectedAmountOptionDescription(): string | null {
    return this.optionDescription('amountOption', this.form.value.amountOption);
  }

  protected selectedDurationOptionDescription(): string | null {
    return this.optionDescription('durationOption', this.form.value.durationOption);
  }

  protected isAdvanceDisabled(): boolean {
    const raw = this.form.value;
    return this.advancing()
      || this.isAssignedToSomeoneElse()
      || (this.needsAssignee() && !raw.assigneeUsername)
      || !raw.rateOption
      || (raw.rateOption === 'MANUAL' && !raw.manualRate)
      || !raw.amountOption
      || (raw.amountOption === 'MANUAL' && !raw.manualAmount)
      || !raw.durationOption
      || (raw.durationOption === 'MANUAL' && !raw.manualDuration)
      || (this.isInsuranceStep() && !this.willReturnDossier() && (
        !raw.insuranceAdiSubscribed || (this.hasRealGuarantees() && !raw.insuranceDamageSubscribed)
      ));
  }

  protected needsAssignee(): boolean {
    return !(this.isLastStep() && !this.willReturnDossier());
  }

  protected assigneeOptions(): UserResponse[] {
    return this.willReturnDossier() ? this.previousEligibleAssignees() : this.nextEligibleAssignees();
  }

  protected isAssignedToSomeoneElse(): boolean {
    const assignedUsername = this.currentStep().assignedUsername;
    return !!assignedUsername && assignedUsername !== this.currentUsername();
  }

  advance(): void {
    this.advancing.set(true);
    this.advanceErrorMessage.set(null);
    this.demandService.advance(this.demand().id, this.advanceRequest()).subscribe({
      next: () => {
        this.advancing.set(false);
        this.resetAdvanceForm();
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.advancing.set(false);
        this.advanceErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.advanceErrorFallback'));
      },
    });
  }

  assign(): void {
    const username = this.assignForm.getRawValue().username;
    if (!username) {
      return;
    }
    this.assigning.set(true);
    this.assignErrorMessage.set(null);
    this.demandService.assign(this.demand().id, { username }).subscribe({
      next: () => {
        this.assigning.set(false);
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.assigning.set(false);
        this.assignErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.assignErrorFallback'));
      },
    });
  }

  addComment(): void {
    const comment = this.commentForm.getRawValue().comment.trim();
    if (!comment) {
      return;
    }
    this.commenting.set(true);
    this.commentErrorMessage.set(null);
    this.demandService.addComment(this.demand().id, { comment }).subscribe({
      next: () => {
        this.commenting.set(false);
        this.commentForm.reset({ comment: '' });
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.commenting.set(false);
        this.commentErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.commentErrorFallback'));
      },
    });
  }

  private optionDescription(kind: string, selected: string | null | undefined): string | null {
    return selected ? this.translate.instant(`demandDetail.choices.${kind}.${selected}.description`) : null;
  }

  private adaptToStep(step: DemandStepResponse, demand: DemandResponse): void {
    this.assignForm.setValue({ username: step.assignedUsername ?? '' });
    if (this.isClassificationStep()) {
      this.actionMode.set('CLASSIFY');
    } else if (this.actionMode() === 'CLASSIFY') {
      this.actionMode.set('ADVANCE');
    }
    if (demand.applicableRate == null && this.form.controls.rateOption.value === 'KEEP') {
      this.form.controls.rateOption.setValue('');
    }
    const controls = this.form.controls;
    this.toggle(!this.isAtFirstStep(), controls.returnReasonCode);
    this.toggle(this.isDecisionStep(), controls.decisionOutcome, controls.recommendations, controls.reserves);
    this.toggle(this.isCommitteeProgStep(), controls.committeeType);
    this.toggle(this.isInsuranceStep(), controls.insuranceAdiSubscribed, controls.insuranceCoverageType,
      controls.insuranceDamageSubscribed);
    this.toggle(this.needsAssignee(), controls.assigneeUsername);
  }

  private toggle(enabled: boolean, ...controls: { enable(): void; disable(): void }[]): void {
    controls.forEach((control) => (enabled ? control.enable() : control.disable()));
  }

  private advanceRequest(): AdvanceDemandRequest {
    const raw = this.form.value;
    return {
      ...(raw.note ? { note: raw.note } : {}),
      ...(raw.decisionOutcome ? { decisionOutcome: raw.decisionOutcome } : {}),
      ...(raw.returnReasonCode ? { returnReasonCode: raw.returnReasonCode } : {}),
      ...(raw.recommendations ? { recommendations: raw.recommendations } : {}),
      ...(raw.reserves ? { reserves: raw.reserves } : {}),
      ...(raw.committeeType ? { committeeType: raw.committeeType } : {}),
      ...(this.isInsuranceStep() ? { insuranceAdiSubscribed: !!raw.insuranceAdiSubscribed } : {}),
      ...(raw.insuranceCoverageType ? { insuranceCoverageType: raw.insuranceCoverageType } : {}),
      ...(this.isInsuranceStep() ? { insuranceDamageSubscribed: !!raw.insuranceDamageSubscribed } : {}),
      ...(raw.assigneeUsername ? { assigneeUsername: raw.assigneeUsername } : {}),
      rateOption: raw.rateOption as RateOption,
      ...(raw.rateOption === 'MANUAL' && raw.manualRate != null ? { manualRate: raw.manualRate } : {}),
      amountOption: raw.amountOption as KeepOrManualOption,
      ...(raw.amountOption === 'MANUAL' && raw.manualAmount != null ? { manualAmount: raw.manualAmount } : {}),
      durationOption: raw.durationOption as KeepOrManualOption,
      ...(raw.durationOption === 'MANUAL' && raw.manualDuration != null
        ? { manualDuration: raw.manualDuration } : {}),
    };
  }

  private resetAdvanceForm(): void {
    this.form.reset({
      note: '', decisionOutcome: '', returnReasonCode: '', recommendations: '', reserves: '', committeeType: '',
      insuranceAdiSubscribed: false, insuranceCoverageType: '', insuranceDamageSubscribed: false,
      assigneeUsername: '', rateOption: '', manualRate: null, amountOption: '', manualAmount: null,
      durationOption: '', manualDuration: null,
    });
  }
}
