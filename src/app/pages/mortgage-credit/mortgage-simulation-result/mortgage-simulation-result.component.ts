import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MortgageCreditResponse } from '../../../core/models/mortgage-credit.model';
import { formatAmount, formatPercent } from '../../../core/utils/format.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mortgage-simulation-result',
  imports: [TranslatePipe],
  templateUrl: './mortgage-simulation-result.component.html',
  styleUrl: '../../simulator-page.css',
})
export class MortgageSimulationResultComponent {
  readonly result = input<MortgageCreditResponse | null>(null);

  protected readonly showSchedule = linkedSignal({ source: this.result, computation: () => false });

  readonly formatAmount = formatAmount;
  readonly formatPercent = formatPercent;

  toggleSchedule(): void {
    this.showSchedule.update((shown) => !shown);
  }
}
