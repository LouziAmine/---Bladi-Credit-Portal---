import { Directive, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../core/services/api-error-message-service/api-error-message.service';

interface VersionedParametersRecord {
  id: string;
  active: boolean;
}

@Directive()
export abstract class VersionedParametersPage<TRecord extends VersionedParametersRecord, TPatch> implements OnInit {
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly translate = inject(TranslateService);
  protected readonly fb = inject(FormBuilder);

  protected abstract readonly loadErrorKey: string;
  protected abstract readonly form: FormGroup;

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly parameters = signal<TRecord[]>([]);
  protected readonly selectedId = signal<string | null>(null);

  protected abstract fetchAll(): Observable<TRecord[]>;

  protected abstract save(id: string, patch: TPatch): Observable<void>;

  protected abstract toFormValue(record: TRecord): Record<string, unknown>;

  protected abstract toPatch(): TPatch;

  ngOnInit(): void {
    this.loadParameters();
  }

  loadParameters(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.fetchAll().subscribe({
      next: (records) => {
        this.loadingList.set(false);
        this.parameters.set(records);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, this.loadErrorKey));
      },
    });
  }

  clearSelection(): void {
    this.selectedId.set(null);
    this.form.reset();
    this.clearMessages();
  }

  selectRecord(record: TRecord): void {
    this.selectedId.set(record.id);
    this.form.patchValue(this.toFormValue(record));
    this.clearMessages();
  }

  submit(): void {
    const id = this.selectedId();
    if (this.form.invalid || id === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.clearMessages();
    this.save(id, this.toPatch()).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.translate.instant('adminCommon.updateSuccess'));
        this.loadParameters();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'adminCommon.updateErrorFallback'));
      },
    });
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
