import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { timer } from 'rxjs';
import { AuthService } from '../../core/services/auth-service/auth.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ApiError } from '../../core/models/api-error.model';
import { passwordComplexity } from '../../shared/validators/password-complexity.validator';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.maxLength(100), passwordComplexity],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        this.form.reset();
        timer(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
          () => void this.router.navigate(['/login']),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? 'Erreur lors de la création du compte.');
      },
    });
  }
}