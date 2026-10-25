import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { BamParametersService } from '../../../core/services/bam-parameters-service/bam-parameters.service';
import { BamParametersResponse, PatchBamParametersRequest } from '../../../core/models/bam-parameters.model';
import { strictlyPositive } from '../../../shared/validators/strictly-positive.validator';
import { VersionedParametersPage } from '../versioned-parameters-page';
import { VersionedParametersLayoutComponent } from '../versioned-parameters-layout/versioned-parameters-layout.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bam-parameters',
  imports: [DecimalPipe, ReactiveFormsModule, TranslatePipe, VersionedParametersLayoutComponent],
  templateUrl: './bam-parameters.component.html',
})
export class BamParametersComponent extends VersionedParametersPage<BamParametersResponse, PatchBamParametersRequest> {
  private readonly bamService = inject(BamParametersService);

  protected readonly loadErrorKey = 'bamParameters.loadErrorFallback';

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

  protected fetchAll(): Observable<BamParametersResponse[]> {
    return this.bamService.getAll().pipe(map((page) => page.items));
  }

  protected save(id: string, patch: PatchBamParametersRequest): Observable<void> {
    return this.bamService.patch(id, patch);
  }

  protected toFormValue(record: BamParametersResponse): Record<string, unknown> {
    return {
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
    };
  }

  protected toPatch(): PatchBamParametersRequest {
    const raw = this.form.value;
    return {
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
  }
}
