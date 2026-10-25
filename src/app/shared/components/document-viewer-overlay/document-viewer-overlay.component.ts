import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DocumentViewerService } from '../../../core/services/document-viewer-service/document-viewer.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-document-viewer-overlay',
  templateUrl: './document-viewer-overlay.component.html',
  styleUrl: './document-viewer-overlay.component.css',
})
export class DocumentViewerOverlayComponent {
  private readonly documentViewerService = inject(DocumentViewerService);

  readonly url = this.documentViewerService.url;

  close(): void {
    this.documentViewerService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
