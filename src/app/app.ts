import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { DocumentViewerOverlayComponent } from
  './shared/components/document-viewer-overlay/document-viewer-overlay.component';
import { DemoBannerComponent } from './demo/demo-banner/demo-banner.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, DocumentViewerOverlayComponent, DemoBannerComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly swUpdate = inject(SwUpdate);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => {
          void this.swUpdate.activateUpdate().then(() => document.location.reload());
        });
      void this.swUpdate.checkForUpdate();
    }
  }
}
