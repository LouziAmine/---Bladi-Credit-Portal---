import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { BamVerificationService } from '../../../core/services/bam-verification-service/bam-verification.service';
import {
  BAM_SCENARIO_OPTIONS,
  BamScenario,
  BamVerificationResponse,
} from '../../../core/models/bam-verification.model';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bam-verification-panel',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe, DatePipe, DecimalPipe],
  templateUrl: './bam-verification-panel.component.html',
})
export class BamVerificationPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly bamVerificationService = inject(BamVerificationService);

  readonly enterpriseType = input.required<string>();
  readonly companyName = input.required<string>();

  protected readonly scenarioOptions = BAM_SCENARIO_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.maxLength(50)]],
    scenario: [''],
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<BamVerificationResponse | null>(null);

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const forcedScenario = raw.scenario ? (raw.scenario as BamScenario) : null;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    this.bamVerificationService.verify(
      { enterpriseType: this.enterpriseType(), identifier: raw.identifier.trim(),
        companyName: this.companyName() },
      forcedScenario,
    ).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.result.set(response);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'bamVerification.errorFallback'));
      },
    });
  }
}
