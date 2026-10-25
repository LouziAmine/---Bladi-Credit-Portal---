import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InvestmentCreditResponse } from '../../../core/models/investment-credit.model';
import { formatAmount, formatPercent } from '../../../core/utils/format.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-investment-simulation-result',
  imports: [TranslatePipe],
  templateUrl: './investment-simulation-result.component.html',
  styleUrl: '../../simulator-page.css',
})
export class InvestmentSimulationResultComponent {
  readonly result = input<InvestmentCreditResponse | null>(null);

  protected readonly showSchedule = linkedSignal({ source: this.result, computation: () => false });

  readonly formatAmount = formatAmount;
  readonly formatPercent = formatPercent;

  toggleSchedule(): void {
    this.showSchedule.update((shown) => !shown);
  }
}
