import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BamParametersService } from '../../../core/services/bam-parameters-service/bam-parameters.service';
import { BamParametersResponse, PatchBamParametersRequest } from '../../../core/models/bam-parameters.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

function strictlyPositive(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as number | null;
  return v === null || v > 0 ? null : { strictlyPositive: true };
}

@Component({
  selector: 'app-bam-parameters',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './bam-parameters.component.html',
  styleUrl: './bam-parameters.component.css',
})

export class BamParametersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bamService = inject(BamParametersService);

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly parameters = signal<BamParametersResponse[]>([]);
  protected readonly selectedId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    processingFeesRatio: [null as number | null, [strictlyPositive]],
    minProcessingFees: [null as number | null, [strictlyPositive]],
    maxProcessingFees: [null as number | null, [strictlyPositive]],
    registrationFeeRatio: [null as number | null, [strictlyPositive]],
    landConservationRatio: [null as number | null, [strictlyPositive]],
    notaryFeeRatio: [null as number | null, [strictlyPositive]],
    ltvRatio: [null as number | null, [strictlyPositive]],
    maxDebtRatio: [null as number | null, [strictlyPositive]],
    maxAgeAtMaturity: [null as number | null, [strictlyPositive]],
    adiMonthlyRate: [null as number | null, [strictlyPositive]],
    active: [null as boolean | null],
  });

  ngOnInit(): void {
    this.loadParameters();
  }

  loadParameters(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.bamService.getAll().subscribe({
      next: (page) => {
        this.loadingList.set(false);
        this.parameters.set(page.items);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Impossible de charger les paramètres. Serveur indisponible.');
      },
    });
  }

  clearSelection(): void {
    this.selectedId.set(null);
    this.form.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  selectRecord(record: BamParametersResponse): void {
    this.selectedId.set(record.id);
    this.form.patchValue({
      processingFeesRatio: record.processingFeesRatio,
      minProcessingFees: record.minProcessingFees,
      maxProcessingFees: record.maxProcessingFees,
      registrationFeeRatio: record.registrationFeeRatio,
      landConservationRatio: record.landConservationRatio,
      notaryFeeRatio: record.notaryFeeRatio,
      ltvRatio: record.ltvRatio,
      maxDebtRatio: record.maxDebtRatio,
      maxAgeAtMaturity: record.maxAgeAtMaturity,
      adiMonthlyRate: record.adiMonthlyRate,
      active: record.active,
    });
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  submit(): void {
    const id = this.selectedId();
    if (this.form.invalid || id === null) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const raw = this.form.value;
    const patch: PatchBamParametersRequest = {
      processingFeesRatio: raw.processingFeesRatio ?? undefined,
      minProcessingFees: raw.minProcessingFees ?? undefined,
      maxProcessingFees: raw.maxProcessingFees ?? undefined,
      registrationFeeRatio: raw.registrationFeeRatio ?? undefined,
      landConservationRatio: raw.landConservationRatio ?? undefined,
      notaryFeeRatio: raw.notaryFeeRatio ?? undefined,
      ltvRatio: raw.ltvRatio ?? undefined,
      maxDebtRatio: raw.maxDebtRatio ?? undefined,
      maxAgeAtMaturity: raw.maxAgeAtMaturity ?? undefined,
      adiMonthlyRate: raw.adiMonthlyRate ?? undefined,
      active: raw.active ?? undefined,
    };

    this.bamService.patch(id, patch).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Paramètres mis à jour avec succès.');
        this.loadParameters();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Erreur lors de la mise à jour.');
      },
    });
  }
}
