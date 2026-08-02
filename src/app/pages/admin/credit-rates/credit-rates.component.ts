import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CreditRateService } from '../../../core/services/credit-rate-service/credit-rate.service';
import { CreditRateResponse, PatchCreditRateRequest } from '../../../core/models/credit-rate.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

function strictlyPositive(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as number | null;
  return v === null || v > 0 ? null : { strictlyPositive: true };
}

function durationRangePaired(group: AbstractControl): ValidationErrors | null {
  const min = group.get('minDurationMonths')?.value as number | null;
  const max = group.get('maxDurationMonths')?.value as number | null;
  return (min === null) === (max === null) ? null : { durationRangeMismatch: true };
}

@Component({
  selector: 'app-credit-rates',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './credit-rates.component.html',
  styleUrl: './credit-rates.component.css',
})
export class CreditRatesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly creditRateService = inject(CreditRateService);

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly rates = signal<CreditRateResponse[]>([]);
  protected readonly selectedId = signal<number | null>(null);

  protected readonly form = this.fb.group(
    {
      rateMin: [null as number | null, [strictlyPositive]],
      rateMax: [null as number | null, [strictlyPositive]],
      minDurationMonths: [null as number | null, [Validators.min(0)]],
      maxDurationMonths: [null as number | null, [Validators.min(0)]],
      active: [null as boolean | null],
    },
    { validators: durationRangePaired },
  );

  ngOnInit(): void {
    this.loadRates();
  }

  loadRates(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.creditRateService.getAll().subscribe({
      next: (page) => {
        this.loadingList.set(false);
        this.rates.set(page.items);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Impossible de charger les taux. Serveur indisponible.');
      },
    });
  }

  clearSelection(): void {
    this.selectedId.set(null);
    this.form.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  selectRecord(record: CreditRateResponse): void {
    this.selectedId.set(record.id);
    this.form.patchValue({
      rateMin: record.rateMin,
      rateMax: record.rateMax,
      minDurationMonths: record.minDurationMonths,
      maxDurationMonths: record.maxDurationMonths,
      active: record.active,
    });
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  submit(): void {
    const id = this.selectedId();
    if (this.form.invalid || id === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.value;
    const patch: PatchCreditRateRequest = {
      rateMin: raw.rateMin ?? undefined,
      rateMax: raw.rateMax ?? undefined,
      minDurationMonths: raw.minDurationMonths ?? undefined,
      maxDurationMonths: raw.maxDurationMonths ?? undefined,
      active: raw.active ?? undefined,
    };

    this.creditRateService.patch(id, patch).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Taux mis à jour avec succès.');
        this.loadRates();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Erreur lors de la mise à jour.');
      },
    });
  }
}
