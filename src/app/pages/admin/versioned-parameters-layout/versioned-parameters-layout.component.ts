import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-versioned-parameters-layout',
  imports: [TranslatePipe, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './versioned-parameters-layout.component.html',
})
export class VersionedParametersLayoutComponent {
  readonly i18nPrefix = input.required<string>();
  readonly heroIcon = input('bi-gear-fill');
  readonly listTitleKey = input('adminCommon.existingConfigs');
  readonly loadingList = input(false);
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly successMessage = input<string | null>(null);
  readonly hasRecords = input(false);
  readonly selectedId = input<string | null>(null);
}
