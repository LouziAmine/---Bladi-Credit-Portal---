import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DemandImportService } from '../../../../core/services/demand-import-service/demand-import.service';
import {
  DEMAND_IMPORT_TERMINAL_STATUSES,
  DemandImportReport,
} from '../../../../core/models/demand-import.model';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';
import { ApiErrorMessageService } from '../../../../core/services/api-error-message-service/api-error-message.service';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const POLL_INTERVAL_MS = 1500;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-demand-import',
  imports: [RouterLink, FormsModule, ErrorMessageComponent, TranslatePipe],
  templateUrl: './demand-import.component.html',
  styleUrl: './demand-import.component.css',
})
export class DemandImportComponent {
  private readonly demandImportService = inject(DemandImportService);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly selectedFileError = signal<string | null>(null);
  protected readonly dragOver = signal(false);
  protected readonly uploading = signal(false);
  protected readonly uploadErrorMessage = signal<string | null>(null);
  protected readonly polling = signal(false);
  protected readonly pollErrorMessage = signal<string | null>(null);
  protected readonly report = signal<DemandImportReport | null>(null);

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.applyFile(target.files?.[0] ?? null);
    target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.uploading() || this.polling()) {
      return;
    }
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.uploading() || this.polling()) {
      return;
    }
    this.applyFile(event.dataTransfer?.files?.[0] ?? null);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.selectedFileError.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} ${this.translate.instant('demandImport.unit.bytes')}`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} ${this.translate.instant('demandImport.unit.kilobytes')}`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${this.translate.instant('demandImport.unit.megabytes')}`;
  }

  private applyFile(file: File | null): void {
    this.selectedFileError.set(null);

    if (file && file.size === 0) {
      this.selectedFile.set(null);
      this.selectedFileError.set(this.translate.instant('demandImport.fileEmpty'));
      return;
    }
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      this.selectedFile.set(null);
      this.selectedFileError.set(this.translate.instant('demandImport.fileTooLarge'));
      return;
    }
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      this.selectedFile.set(null);
      this.selectedFileError.set(this.translate.instant('demandImport.fileTypeNotAllowed'));
      return;
    }
    this.selectedFile.set(file);
  }

  startImport(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.uploadErrorMessage.set(null);
    this.report.set(null);
    this.pollErrorMessage.set(null);

    this.demandImportService.startImport(file).subscribe({
      next: (started) => {
        this.uploading.set(false);
        this.selectedFile.set(null);
        const input = this.fileInput()?.nativeElement;
        if (input) {
          input.value = '';
        }
        this.pollReport(started.jobExecutionId);
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadErrorMessage.set(this.apiErrors.describe(err, 'demandImport.startErrorFallback'));
      },
    });
  }

  startOver(): void {
    this.report.set(null);
    this.pollErrorMessage.set(null);
    this.uploadErrorMessage.set(null);
  }

  isTerminal(status: DemandImportReport['status']): boolean {
    return DEMAND_IMPORT_TERMINAL_STATUSES.includes(status);
  }

  private pollReport(jobExecutionId: number): void {
    this.polling.set(true);
    timer(0, POLL_INTERVAL_MS).pipe(
      switchMap(() => this.demandImportService.getReport(jobExecutionId)),
      takeWhile((report) => !this.isTerminal(report.status), true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        if (this.isTerminal(report.status)) {
          this.polling.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.polling.set(false);
        this.pollErrorMessage.set(this.apiErrors.describe(err, 'demandImport.pollErrorFallback'));
      },
    });
  }
}
