import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user-service/user.service';
import { AuthService } from '../../../core/services/auth-service/auth.service';
import { ReferenceDataService } from '../../../core/services/reference-data-service/reference-data.service';
import { CreateUserRequest, UserResponse, UserRole } from '../../../core/models/user.model';
import { GradeResponse, TeamResponse } from '../../../core/models/reference-data.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { passwordComplexity } from '../../../shared/validators/password-complexity.validator';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorMessageService } from '../../../core/services/api-error-message-service/api-error-message.service';

const ROLES: UserRole[] = ['CLIENT', 'MANAGER'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users',
  imports: [ReactiveFormsModule, ErrorMessageComponent, LoadingSpinnerComponent, TranslatePipe],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiErrors = inject(ApiErrorMessageService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly referenceDataService = inject(ReferenceDataService);
  private readonly translate = inject(TranslateService);

  protected readonly roles = ROLES;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly loadingList = signal(false);
  protected readonly listErrorMessage = signal<string | null>(null);
  protected readonly users = signal<UserResponse[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly updatingUserId = signal<string | null>(null);
  protected readonly currentUsername = this.authService.getCurrentUsername();

  protected readonly grades = signal<GradeResponse[]>([]);
  protected readonly teams = signal<TeamResponse[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    fullName: [''],
    email: ['', [Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.maxLength(100), passwordComplexity],
    ],
    role: ['CLIENT' as UserRole, [Validators.required]],
    gradeCode: [''],
    teamCode: [''],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.referenceDataService.getGrades().subscribe({ next: (grades) => this.grades.set(grades) });
    this.referenceDataService.getTeams().subscribe({ next: (teams) => this.teams.set(teams) });
  }

  loadUsers(page = this.currentPage()): void {
    this.loadingList.set(true);
    this.listErrorMessage.set(null);
    this.userService.getAll(page).subscribe({
      next: (result) => {
        this.loadingList.set(false);
        this.users.set(result.items);
        this.currentPage.set(result.currentPage);
        this.lastPage.set(Math.max(result.lastPage, 1));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingList.set(false);
        this.listErrorMessage.set(this.apiErrors.describe(err, 'users.loadErrorFallback'));
      },
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.loadUsers(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.lastPage()) {
      this.loadUsers(this.currentPage() + 1);
    }
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
        this.listErrorMessage.set(this.apiErrors.describe(err, 'users.roleChangeErrorFallback'));
      },
    });
  }

  updateProfile(user: UserResponse, gradeCode: string, teamCode: string, email?: string): void {
    this.updatingUserId.set(user.id);
    this.listErrorMessage.set(null);

    this.userService.updateUserProfile(user.id, {
      gradeCode: gradeCode || null,
      teamCode: teamCode || null,
      email: email !== undefined ? (email || null) : user.email,
    }).subscribe({
      next: () => {
        this.updatingUserId.set(null);
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingUserId.set(null);
        this.listErrorMessage.set(this.apiErrors.describe(err, 'users.profileUpdateErrorFallback'));
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

    const raw = this.form.getRawValue();
    const request: CreateUserRequest = {
      username: raw.username,
      password: raw.password,
      role: raw.role,
      ...(raw.fullName ? { fullName: raw.fullName } : {}),
      ...(raw.email ? { email: raw.email } : {}),
      ...(raw.gradeCode ? { gradeCode: raw.gradeCode } : {}),
      ...(raw.teamCode ? { teamCode: raw.teamCode } : {}),
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(
          this.translate.instant('users.createSuccess', { username: this.form.value.username }),
        );
        this.form.reset({ role: 'CLIENT', fullName: '', email: '', gradeCode: '', teamCode: '' });
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.apiErrors.describe(err, 'users.createErrorFallback'));
      },
    });
  }
}
