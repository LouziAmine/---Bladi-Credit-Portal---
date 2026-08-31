import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
import { DocumentViewerOverlayComponent } from
  './shared/components/document-viewer-overlay/document-viewer-overlay.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, DocumentViewerOverlayComponent],
  templateUrl: './app.html',
})
export class App {}
