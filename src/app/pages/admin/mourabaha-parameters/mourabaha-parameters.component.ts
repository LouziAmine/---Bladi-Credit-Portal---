import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MourabahaParametersService } from '../../../core/services/mourabaha-parameters-service/mourabaha-parameters.service';
import {
  MourabahaParametersResponse,
  PatchMourabahaParametersRequest,
} from '../../../core/models/mourabaha-parameters.model';
import { strictlyPositive } from '../../../shared/validators/strictly-positive.validator';
import { VersionedParametersPage } from '../versioned-parameters-page';
import { VersionedParametersLayoutComponent } from '../versioned-parameters-layout/versioned-parameters-layout.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mourabaha-parameters',
  imports: [ReactiveFormsModule, TranslatePipe, VersionedParametersLayoutComponent],
  templateUrl: './mourabaha-parameters.component.html',
})
export class MourabahaParametersComponent
  extends VersionedParametersPage<MourabahaParametersResponse, PatchMourabahaParametersRequest> {
  private readonly mourabahaService = inject(MourabahaParametersService);

  protected readonly loadErrorKey = 'mourabahaParameters.loadErrorFallback';

  protected readonly form = this.fb.group({
    profitRate: [null as number | null, [strictlyPositive]],
    vatRate: [null as number | null, [strictlyPositive]],
    takafulMonthlyRate: [null as number | null, [strictlyPositive]],
    active: [null as boolean | null],
  });

  protected fetchAll(): Observable<MourabahaParametersResponse[]> {
    return this.mourabahaService.getAll().pipe(map((page) => page.items));
  }

  protected save(id: string, patch: PatchMourabahaParametersRequest): Observable<void> {
    return this.mourabahaService.patch(id, patch);
  }

  protected toFormValue(record: MourabahaParametersResponse): Record<string, unknown> {
    return {
      profitRate: record.profitRate,
      vatRate: record.vatRate,
      takafulMonthlyRate: record.takafulMonthlyRate,
      active: record.active,
    };
  }

  protected toPatch(): PatchMourabahaParametersRequest {
    const raw = this.form.value;
    return {
      profitRate: raw.profitRate ?? undefined,
      vatRate: raw.vatRate ?? undefined,
      takafulMonthlyRate: raw.takafulMonthlyRate ?? undefined,
      active: raw.active ?? undefined,
    };
  }
}
