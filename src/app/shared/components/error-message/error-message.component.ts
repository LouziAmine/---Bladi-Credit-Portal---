import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-error-message',
  imports: [],
  templateUrl: './error-message.component.html',
})
export class ErrorMessageComponent {
  readonly message = input<string | null>(null);
}