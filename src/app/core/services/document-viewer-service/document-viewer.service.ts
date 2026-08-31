import { inject, Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = signal<SafeResourceUrl | null>(null);

  private objectUrl: string | null = null;

  open(download$: Observable<Blob>): Observable<void> {
    return download$.pipe(
      tap((blob) => {
        this.revokeObjectUrl();
        this.objectUrl = window.URL.createObjectURL(blob);
        this.url.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
      }),
      map(() => undefined),
    );
  }

  close(): void {
    this.url.set(null);
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      window.URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
