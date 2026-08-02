import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MourabahaParametersService } from '../../../core/services/mourabaha-parameters-service/mourabaha-parameters.service';
import {
  MourabahaParametersResponse,
  PatchMourabahaParametersRequest,
} from '../../../core/models/mourabaha-parameters.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

function strictlyPositive(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as number | null;
  return v === null || v > 0 ? null : { strictlyPositive: true };
}

@Component({
  selector: 'app-mourabaha-parameters',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './mourabaha-parameters.component.html',
  styleUrl: './mourabaha-parameters.component.css',
})
export class MourabahaParametersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mourabahaService = inject(MourabahaParametersService);

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly parameters = signal<MourabahaParametersResponse[]>([]);
  protected readonly selectedId = signal<number | null>(null);

  protected readonly form = this.fb.group({
    profitRate: [null as number | null, [strictlyPositive]],
    vatRate: [null as number | null, [strictlyPositive]],
    active: [null as boolean | null],
  });

  ngOnInit(): void {
    this.loadParameters();
  }

  loadParameters(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.mourabahaService.getAll().subscribe({
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

  selectRecord(record: MourabahaParametersResponse): void {
    this.selectedId.set(record.id);
    this.form.patchValue({
      profitRate: record.profitRate,
      vatRate: record.vatRate,
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
    const patch: PatchMourabahaParametersRequest = {
      profitRate: raw.profitRate ?? undefined,
      vatRate: raw.vatRate ?? undefined,
      active: raw.active ?? undefined,
    };

    this.mourabahaService.patch(id, patch).subscribe({
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
