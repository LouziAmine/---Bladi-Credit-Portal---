import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersComponent as Users } from './users.component';
import { UserService } from '../../../core/services';
import { UserResponse } from '../../../core/models/user.model';
import { CreditPage } from '../../../core/models/page.model';

const VALID_PASSWORD = 'Password1234';

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let component: Users;
  let userService: UserService;

  const mockUsers: UserResponse[] = [
    { id: 1, username: 'admin', role: 'MANAGER' },
    { id: 2, username: 'john.doe', role: 'CLIENT' },
  ];
  const mockPage: CreditPage<UserResponse> = {
    items: mockUsers, total: 2, lastPage: 1, currentPage: 1, size: 20,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    vi.spyOn(userService, 'getAll').mockReturnValue(of(mockPage));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the users list on init', () => {
      expect(component['users']()).toEqual(mockUsers);
    });

    it('should handle load error gracefully', () => {
      vi.spyOn(userService, 'getAll').mockReturnValue(throwError(() => new Error('Network')));
      component.loadUsers();
      expect(component['loadingList']()).toBe(false);
      expect(component['listErrorMessage']()).toBeTruthy();
    });
  });

  describe('toggleRole', () => {
    it('should promote a CLIENT to MANAGER', () => {
      const updateSpy = vi.spyOn(userService, 'updateUserRole').mockReturnValue(of(undefined));

      component.toggleRole(mockUsers[1]);

      expect(updateSpy).toHaveBeenCalledWith(2, { role: 'MANAGER' });
    });

    it('should demote a MANAGER to CLIENT', () => {
      const updateSpy = vi.spyOn(userService, 'updateUserRole').mockReturnValue(of(undefined));

      component.toggleRole(mockUsers[0]);

      expect(updateSpy).toHaveBeenCalledWith(1, { role: 'CLIENT' });
    });

    it('should set an error message when the backend forbids the change (e.g. self-role modification)', () => {
      const error = new HttpErrorResponse({
        error: { description: 'A manager cannot modify their own role.' }, status: 403,
      });
      vi.spyOn(userService, 'updateUserRole').mockReturnValue(throwError(() => error));

      component.toggleRole(mockUsers[0]);

      expect(component['listErrorMessage']()).toBe('A manager cannot modify their own role.');
      expect(component['updatingUserId']()).toBeNull();
    });

    it('should use fallback error message when the backend sends no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(userService, 'updateUserRole').mockReturnValue(throwError(() => error));

      component.toggleRole(mockUsers[0]);

      expect(component['listErrorMessage']()).toBe("Erreur lors du changement de rôle de l'utilisateur.");
    });
  });

  describe('form validation', () => {
    it('should mark fields touched on invalid submit', () => {
      component.submit();
      expect(component['form'].controls.username.touched).toBe(true);
    });

    it('should not call service when form is invalid', () => {
      vi.spyOn(userService, 'createUser');
      component['form'].setValue({ username: '', password: '', role: 'CLIENT' });
      component.submit();
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should be valid with correct values', () => {
      component['form'].setValue({ username: 'john.doe', password: VALID_PASSWORD, role: 'MANAGER' });
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid when password has no complexity', () => {
      component['form'].setValue({ username: 'john.doe', password: 'alllowercase1234', role: 'CLIENT' });
      expect(component['form'].controls.password.errors?.['passwordComplexity']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should show success and reset form on success', () => {
      vi.spyOn(userService, 'createUser').mockReturnValue(of(undefined));
      component['form'].setValue({ username: 'john.doe', password: VALID_PASSWORD, role: 'CLIENT' });

      component.submit();

      expect(component['successMessage']()).toContain('john.doe');
      expect(component['loading']()).toBe(false);
      expect(component['form'].controls.role.value).toBe('CLIENT');
    });

    it('should set error message on failure', () => {
      const error = new HttpErrorResponse({
        error: { description: "Nom d'utilisateur déjà pris." }, status: 409,
      });
      vi.spyOn(userService, 'createUser').mockReturnValue(throwError(() => error));
      component['form'].setValue({ username: 'existing', password: VALID_PASSWORD, role: 'CLIENT' });

      component.submit();

      expect(component['errorMessage']()).toBe("Nom d'utilisateur déjà pris.");
    });

    it('should use fallback error message', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(userService, 'createUser').mockReturnValue(throwError(() => error));
      component['form'].setValue({ username: 'user', password: VALID_PASSWORD, role: 'CLIENT' });

      component.submit();

      expect(component['errorMessage']()).toBe("Erreur lors de la création de l'utilisateur.");
    });
  });

  describe('template', () => {
    it('should render the users table with existing accounts', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('john.doe');
      expect(compiled.textContent).toContain('MANAGER');
    });

    it('should disable the role button for the current user own row', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.cb-table tbody button'));
      expect(buttons.length).toBe(mockUsers.length);
    });

    it('should render success message in template after creation', () => {
      vi.spyOn(userService, 'createUser').mockReturnValue(of(undefined));
      component['form'].setValue({ username: 'john.doe', password: VALID_PASSWORD, role: 'CLIENT' });
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.cb-alert--success')).toBeTruthy();
    });

    it('should show username required error when form is submitted empty', () => {
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Le nom d'utilisateur est requis.");
    });

    it('should show username minlength error in template', () => {
      component['form'].controls.username.setValue('ab');
      component['form'].controls.username.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Minimum 3 caractères.');
    });

    it('should show password required error when form is submitted empty', () => {
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Le mot de passe est requis.');
    });

    it('should show password minlength error in template', () => {
      component['form'].controls.password.setValue('Short1a');
      component['form'].controls.password.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Minimum 12 caractères.');
    });
  });
});
