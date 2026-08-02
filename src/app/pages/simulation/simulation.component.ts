import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SimulationService } from '../../core/services/simulation-service/simulation.service';
import {
  CspCode,
  CSP_OPTIONS,
  ProductType,
  SimulationRequest,
  SimulationResponse,
} from '../../core/models/simulation.model';
import { ApiError } from '../../core/models/api-error.model';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { formatDuration, formatAmount, formatPercent, sliderFill } from './simulation.utils';

@Component({
  selector: 'app-simulation',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css',
})
export class SimulationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly simulationService = inject(SimulationService);

  protected readonly cspOptions = CSP_OPTIONS;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly result = signal<SimulationResponse | null>(null);
  protected readonly showSchedule = signal(false);
  private readonly amountValue = signal(500000);
  private readonly durationValue = signal(240);

  protected readonly form = this.fb.nonNullable.group({
    amount: [500000, [Validators.required, Validators.min(70000), Validators.max(30000000)]],
    duration: [240, [Validators.required, Validators.min(12), Validators.max(300)]],
    cspCode: ['' as CspCode, [Validators.required]],
    productType: ['CONVENTIONAL' as ProductType, [Validators.required]],
    nationalityCode: [{ value: 'MA', disabled: true }],
    moroccanResident: [true, [Validators.required]],
    propertyValue: [600000, [Validators.required, Validators.min(80000), Validators.max(50000000)]],
    monthlyIncome: [15000, [Validators.required, Validators.min(1000), Validators.max(5000000)]],
    age: [35, [Validators.required, Validators.min(18), Validators.max(74)]],
    coBorrower: [false],
    coBorrowerMonthlyIncome: [0],
  });

  readonly formatDuration = formatDuration;
  readonly formatAmount = formatAmount;
  readonly formatPercent = formatPercent;

  protected readonly amountFill = computed(() => sliderFill(this.amountValue(), 70000, 30000000));
  protected readonly durationFill = computed(() => sliderFill(this.durationValue(), 12, 300));

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    this.showSchedule.set(false);

    const raw = this.form.getRawValue();
    const request: SimulationRequest = {
      amount: raw.amount,
      duration: raw.duration,
      cspCode: raw.cspCode,
      productType: raw.productType,
      nationalityCode: raw.nationalityCode,
      moroccanResident: raw.moroccanResident,
      propertyValue: raw.propertyValue,
      monthlyIncome: raw.monthlyIncome,
      age: raw.age,
      coBorrower: raw.coBorrower,
      ...(raw.coBorrower ? { coBorrowerMonthlyIncome: raw.coBorrowerMonthlyIncome } : {}),
    };

    this.simulationService.simulate(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.result.set(response);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Erreur lors de la simulation.');
      },
    });
  }

  reset(): void {
    this.form.reset({
      amount: 500000,
      duration: 240,
      cspCode: '' as CspCode,
      productType: 'CONVENTIONAL',
      nationalityCode: 'MA',
      moroccanResident: true,
      propertyValue: 600000,
      monthlyIncome: 15000,
      age: 35,
      coBorrower: false,
      coBorrowerMonthlyIncome: 0,
    });
    this.amountValue.set(500000);
    this.durationValue.set(240);
    this.result.set(null);
    this.errorMessage.set(null);
    this.showSchedule.set(false);
  }

  onAmountChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.form.controls.amount.setValue(val);
    this.amountValue.set(val);
  }

  onDurationChange(event: Event): void {
    const val = +(event.target as HTMLInputElement).value;
    this.form.controls.duration.setValue(val);
    this.durationValue.set(val);
  }

  toggleSchedule(): void {
    this.showSchedule.update((v) => !v);
  }
}
