import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DemandService } from '../../../../../core/services/demand-service/demand.service';
import { EnterpriseService } from '../../../../../core/services/enterprise-service/enterprise.service';
import { ApiErrorMessageService } from
  '../../../../../core/services/api-error-message-service/api-error-message.service';
import {
  CLASSIFICATION_OUTCOME_CHOICES,
  ClassificationOutcome,
  ClassifyDemandRequest,
  DemandResponse,
} from '../../../../../core/models/demand.model';
import { EnterpriseMatchResponse, EnterpriseResponse } from '../../../../../core/models/enterprise.model';
import { UserResponse } from '../../../../../core/models/user.model';
import { ErrorMessageComponent } from '../../../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-classification',
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './demand-classification.component.html',
})
export class DemandClassificationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly demandService = inject(DemandService);
  private readonly enterpriseService = inject(EnterpriseService);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly demand = input.required<DemandResponse>();
  readonly nextEligibleAssignees = input<UserResponse[]>([]);
  readonly classified = output<void>();

  protected readonly classificationOutcomeChoices = CLASSIFICATION_OUTCOME_CHOICES;

  protected readonly isEnterpriseDemand = computed(() => this.demand().demandType === 'ENTERPRISE');
  protected readonly enterprises = signal<EnterpriseResponse[]>([]);
  protected readonly classifying = signal(false);
  protected readonly classifyErrorMessage = signal<string | null>(null);
  protected readonly classifyMatch = signal<EnterpriseMatchResponse | null>(null);
  protected readonly checkingClassifyMatch = signal(false);
  protected readonly creatingEnterpriseFromMatch = signal(false);
  protected readonly classifyMatchErrorMessage = signal<string | null>(null);

  protected readonly classifyForm = this.fb.group({
    classificationOutcome: ['' as ClassificationOutcome | ''],
    enterpriseId: [null as string | null],
    assigneeUsername: [''],
    note: [''],
    clientRib: [''],
  });

  ngOnInit(): void {
    this.enterpriseService.getAll(1, 100).subscribe({
      next: (page) => this.enterprises.set(page.items),
      error: () => this.enterprises.set([]),
    });
    this.classifyForm.controls.classificationOutcome.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((outcome) => {
        if (outcome === 'REAL' && this.isEnterpriseDemand()
            && this.classifyMatch() === null && !this.checkingClassifyMatch()) {
          this.checkEnterpriseMatch();
        }
      });
  }

  protected selectedClassificationOutcomeDescription(): string | null {
    const selected = this.classifyForm.value.classificationOutcome;
    return selected
      ? this.translate.instant(`demandDetail.choices.classificationOutcome.${selected}.description`)
      : null;
  }

  protected isClassifyDisabled(): boolean {
    const raw = this.classifyForm.value;
    if (this.classifying() || !raw.classificationOutcome) {
      return true;
    }
    return raw.classificationOutcome === 'REAL'
      && ((this.isEnterpriseDemand() && !raw.enterpriseId) || !raw.assigneeUsername);
  }

  classify(): void {
    const raw = this.classifyForm.value;
    if (!raw.classificationOutcome) {
      return;
    }

    this.classifying.set(true);
    this.classifyErrorMessage.set(null);

    const request: ClassifyDemandRequest = {
      classificationOutcome: raw.classificationOutcome,
      ...(raw.classificationOutcome === 'REAL' && raw.enterpriseId != null ? { enterpriseId: raw.enterpriseId } : {}),
      ...(raw.assigneeUsername ? { assigneeUsername: raw.assigneeUsername } : {}),
      ...(raw.note ? { note: raw.note } : {}),
      ...(raw.classificationOutcome === 'REAL' && raw.clientRib ? { clientRib: raw.clientRib } : {}),
    };

    this.demandService.classify(this.demand().id, request).subscribe({
      next: () => {
        this.classifying.set(false);
        this.classifyForm.reset({
          classificationOutcome: '', enterpriseId: null, assigneeUsername: '', note: '', clientRib: '',
        });
        this.classifyMatch.set(null);
        this.classified.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.classifying.set(false);
        this.classifyErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.classifyErrorFallback'));
      },
    });
  }

  protected useMatchedEnterprise(): void {
    const enterprise = this.classifyMatch()?.enterprise;
    if (enterprise) {
      this.classifyForm.patchValue({ enterpriseId: enterprise.id });
    }
  }

  protected createAndAttachEnterprise(): void {
    this.creatingEnterpriseFromMatch.set(true);
    this.classifyMatchErrorMessage.set(null);
    this.enterpriseService.create({ name: this.demand().contactName }).subscribe({
      next: (created) => {
        this.creatingEnterpriseFromMatch.set(false);
        this.enterprises.update((enterprises) => [...enterprises, created]);
        this.classifyForm.patchValue({ enterpriseId: created.id });
        this.classifyMatch.set({ matched: true, enterprise: created });
      },
      error: (err: HttpErrorResponse) => {
        this.creatingEnterpriseFromMatch.set(false);
        this.classifyMatchErrorMessage.set(
          this.apiErrors.describe(err, 'demandDetail.createEnterpriseErrorFallback'));
      },
    });
  }

  private checkEnterpriseMatch(): void {
    this.checkingClassifyMatch.set(true);
    this.classifyMatchErrorMessage.set(null);
    this.enterpriseService.matchByName(this.demand().contactName).subscribe({
      next: (result) => {
        this.checkingClassifyMatch.set(false);
        this.classifyMatch.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.checkingClassifyMatch.set(false);
        this.classifyMatchErrorMessage.set(this.apiErrors.describe(err, 'demandDetail.matchCheckErrorFallback'));
      },
    });
  }
}
