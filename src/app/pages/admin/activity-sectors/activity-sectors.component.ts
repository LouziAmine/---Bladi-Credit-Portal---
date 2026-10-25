import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivitySectorService } from '../../../core/services/activity-sector-service/activity-sector.service';
import { ActivitySectorResponse } from '../../../core/models/activity-sector.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-activity-sectors',
  imports: [DatePipe, ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './activity-sectors.component.html',
})
export class ActivitySectorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly activitySectorService = inject(ActivitySectorService);
  private readonly translate = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly activitySectors = signal<ActivitySectorResponse[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.loadSectors();
  }

  loadSectors(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);
    this.activitySectorService.getAll().subscribe({
      next: (sectors) => {
        this.loadingList.set(false);
        this.activitySectors.set(sectors);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'activitySectors.loadErrorFallback'));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.activitySectorService.create({ name: this.form.getRawValue().name }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.translate.instant('activitySectors.addSuccess'));
        this.form.reset({ name: '' });
        this.loadSectors();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'activitySectors.addErrorFallback'));
      },
    });
  }
}
