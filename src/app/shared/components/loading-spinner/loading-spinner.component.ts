import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loading-spinner',
  imports: [],
  templateUrl: './loading-spinner.component.html',
})
export class LoadingSpinnerComponent {
  readonly loading = input(false);
  readonly message = input('Chargement...');
}