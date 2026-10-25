import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DemandResponse, DemandStepResponse } from '../../../../../core/models/demand.model';
import { formatAmount } from '../../../../../core/utils/format.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-summary',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './demand-summary.component.html',
})
export class DemandSummaryComponent {
  readonly demand = input.required<DemandResponse>();
  readonly currentStep = input<DemandStepResponse | null>(null);

  readonly formatAmount = formatAmount;
}
