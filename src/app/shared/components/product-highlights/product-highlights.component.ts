import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProductReason {
  key: string;
  icon: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-highlights',
  imports: [TranslatePipe],
  templateUrl: './product-highlights.component.html',
  styleUrl: './product-highlights.component.css',
})
export class ProductHighlightsComponent {
  readonly i18nPrefix = input.required<string>();
  readonly reasons = input.required<ProductReason[]>();
  readonly stepIcons = input.required<string[]>();

  protected readonly steps = computed(() => this.stepIcons().map((icon, index) => ({
    icon,
    key: `step${index + 1}`,
    last: index === this.stepIcons().length - 1,
  })));
}
