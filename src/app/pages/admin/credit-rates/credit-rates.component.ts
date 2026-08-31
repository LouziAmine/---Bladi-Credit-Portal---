import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { CreditRateService } from '../../../core/services/credit-rate-service/credit-rate.service';
import { CreditRateResponse, PatchCreditRateRequest } from '../../../core/models/credit-rate.model';
import { strictlyPositive } from '../../../shared/validators/strictly-positive.validator';
import { VersionedParametersPage } from '../versioned-parameters-page';
import { VersionedParametersLayoutComponent } from '../versioned-parameters-layout/versioned-parameters-layout.component';

function durationRangePaired(group: AbstractControl): ValidationErrors | null {
  const min = group.get('minDurationMonths')?.value as number | null;
  const max = group.get('maxDurationMonths')?.value as number | null;
  return (min === null) === (max === null) ? null : { durationRangeMismatch: true };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-credit-rates',
  imports: [ReactiveFormsModule, TranslatePipe, VersionedParametersLayoutComponent],
  templateUrl: './credit-rates.component.html',
})
export class CreditRatesComponent extends VersionedParametersPage<CreditRateResponse, PatchCreditRateRequest> {
  private readonly creditRateService = inject(CreditRateService);

  protected readonly loadErrorKey = 'creditRates.loadErrorFallback';

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

  protected fetchAll(): Observable<CreditRateResponse[]> {
    return this.creditRateService.getAll().pipe(map((page) => page.items));
  }

  protected save(id: string, patch: PatchCreditRateRequest): Observable<void> {
    return this.creditRateService.patch(id, patch);
  }

  protected toFormValue(record: CreditRateResponse): Record<string, unknown> {
    return {
      rateMin: record.rateMin,
      rateMax: record.rateMax,
      minDurationMonths: record.minDurationMonths,
      maxDurationMonths: record.maxDurationMonths,
      active: record.active,
    };
  }

  protected toPatch(): PatchCreditRateRequest {
    const raw = this.form.value;
    return {
      rateMin: raw.rateMin ?? undefined,
      rateMax: raw.rateMax ?? undefined,
      minDurationMonths: raw.minDurationMonths ?? undefined,
      maxDurationMonths: raw.maxDurationMonths ?? undefined,
      active: raw.active ?? undefined,
    };
  }
}
