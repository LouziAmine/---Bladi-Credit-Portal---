import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { timer } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientInvitationService } from '../../core/services/client-invitation-service/client-invitation.service';
import { ClientInvitationPreviewResponse } from '../../core/models/client-invitation.model';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { passwordComplexity } from '../../shared/validators/password-complexity.validator';
import { ApiErrorMessageService } from '../../core/services/api-error-message-service/api-error-message.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-invitations',
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css',
})
export class InvitationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly invitationService = inject(ClientInvitationService);

  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  protected readonly loadingPreview = signal(true);
  protected readonly previewErrorMessage = signal<string | null>(null);
  protected readonly preview = signal<ClientInvitationPreviewResponse | null>(null);
  protected readonly isMortgage = computed(() => !!this.preview()?.demandReference);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.maxLength(100), passwordComplexity],
    ],
  });

  ngOnInit(): void {
    this.invitationService.preview(this.token).subscribe({
      next: (result) => {
        this.loadingPreview.set(false);
        this.preview.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPreview.set(false);
        this.previewErrorMessage.set(this.apiErrors.describe(err, 'invitations.previewErrorFallback'));
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.invitationService.accept(this.token, this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set(this.translate.instant(this.isMortgage() ? 'invitations.successMortgage' : 'invitations.success'));
        this.form.reset();
        timer(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
          () => void this.router.navigate(['/login']),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'invitations.errorFallback'));
      },
    });
  }
}
