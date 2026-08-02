import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user-service/user.service';
import { AuthService } from '../../../core/services/auth-service/auth.service';
import { UserResponse, UserRole } from '../../../core/models/user.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { passwordComplexity } from '../../../shared/validators/password-complexity.validator';

const ROLES: UserRole[] = ['CLIENT', 'MANAGER'];

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  protected readonly roles = ROLES;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly loadingList = signal(false);
  protected readonly listErrorMessage = signal<string | null>(null);
  protected readonly users = signal<UserResponse[]>([]);
  protected readonly updatingUserId = signal<number | null>(null);
  protected readonly currentUsername = this.authService.getCurrentUsername();

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.maxLength(100), passwordComplexity],
    ],
    role: ['CLIENT' as UserRole, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingList.set(true);
    this.listErrorMessage.set(null);
    this.userService.getAll().subscribe({
      next: (page) => {
        this.loadingList.set(false);
        this.users.set(page.items);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        const apiError = err.error as ApiError;
        this.listErrorMessage.set(apiError?.description ?? 'Impossible de charger les utilisateurs.');
      },
    });
  }

  toggleRole(user: UserResponse): void {
    const nextRole: UserRole = user.role === 'MANAGER' ? 'CLIENT' : 'MANAGER';
    this.updatingUserId.set(user.id);
    this.listErrorMessage.set(null);

    this.userService.updateUserRole(user.id, { role: nextRole }).subscribe({
      next: () => {
        this.updatingUserId.set(null);
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingUserId.set(null);
        const apiError = err.error as ApiError;
        this.listErrorMessage.set(
          apiError?.description ?? "Erreur lors du changement de rôle de l'utilisateur.",
        );
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.userService.createUser(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(`Utilisateur "${this.form.value.username}" créé avec succès.`);
        this.form.reset({ role: 'CLIENT' });
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const apiError = err.error as ApiError;
        this.errorMessage.set(apiError?.description ?? "Erreur lors de la création de l'utilisateur.");
      },
    });
  }
}
