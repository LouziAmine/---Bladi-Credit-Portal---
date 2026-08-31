import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { InvestmentCreditParametersService } from '../../../core/services/investment-credit-parameters-service/investment-credit-parameters.service';
import {
  InvestmentCreditParametersResponse,
  PatchInvestmentCreditParametersRequest,
} from '../../../core/models/investment-credit-parameters.model';
import { ENTERPRISE_TYPE_OPTIONS } from '../../../core/models/investment-credit.model';
import { strictlyPositive } from '../../../shared/validators/strictly-positive.validator';
import { VersionedParametersPage } from '../versioned-parameters-page';
import { VersionedParametersLayoutComponent } from '../versioned-parameters-layout/versioned-parameters-layout.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-investment-credit-parameters',
  imports: [ReactiveFormsModule, TranslatePipe, VersionedParametersLayoutComponent],
  templateUrl: './investment-credit-parameters.component.html',
})
export class InvestmentCreditParametersComponent
  extends VersionedParametersPage<InvestmentCreditParametersResponse, PatchInvestmentCreditParametersRequest> {
  private readonly parametersService = inject(InvestmentCreditParametersService);

  protected readonly loadErrorKey = 'investmentCreditParameters.loadErrorFallback';

  protected readonly form = this.fb.group({
    rateMin: [null as number | null, [strictlyPositive]],
    rateMax: [null as number | null, [strictlyPositive]],
    minCompanyAgeYears: [null as number | null],
    maxFinancingToRevenueRatio: [null as number | null, [strictlyPositive]],
    minGuaranteeCoverageRatio: [null as number | null, [strictlyPositive]],
    maxDebtServiceRatio: [null as number | null, [strictlyPositive]],
    processingFeesRatio: [null as number | null, [strictlyPositive]],
    insurancePremiumRatio: [null as number | null, [strictlyPositive]],
    active: [null as boolean | null],
  });

  protected fetchAll(): Observable<InvestmentCreditParametersResponse[]> {
    return forkJoin(ENTERPRISE_TYPE_OPTIONS.map((type) => this.parametersService.getByType(type)));
  }

  protected save(id: string, patch: PatchInvestmentCreditParametersRequest): Observable<void> {
    return this.parametersService.patch(id, patch);
  }

  protected toFormValue(record: InvestmentCreditParametersResponse): Record<string, unknown> {
    return {
      rateMin: record.rateMin,
      rateMax: record.rateMax,
      minCompanyAgeYears: record.minCompanyAgeYears,
      maxFinancingToRevenueRatio: record.maxFinancingToRevenueRatio,
      minGuaranteeCoverageRatio: record.minGuaranteeCoverageRatio,
      maxDebtServiceRatio: record.maxDebtServiceRatio,
      processingFeesRatio: record.processingFeesRatio,
      insurancePremiumRatio: record.insurancePremiumRatio,
      active: record.active,
    };
  }

  protected toPatch(): PatchInvestmentCreditParametersRequest {
    const raw = this.form.value;
    return {
      rateMin: raw.rateMin ?? undefined,
      rateMax: raw.rateMax ?? undefined,
      minCompanyAgeYears: raw.minCompanyAgeYears ?? undefined,
      maxFinancingToRevenueRatio: raw.maxFinancingToRevenueRatio ?? undefined,
      minGuaranteeCoverageRatio: raw.minGuaranteeCoverageRatio ?? undefined,
      maxDebtServiceRatio: raw.maxDebtServiceRatio ?? undefined,
      processingFeesRatio: raw.processingFeesRatio ?? undefined,
      insurancePremiumRatio: raw.insurancePremiumRatio ?? undefined,
      active: raw.active ?? undefined,
    };
  }
}
