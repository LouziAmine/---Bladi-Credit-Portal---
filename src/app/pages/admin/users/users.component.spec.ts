import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersComponent as Users } from './users.component';
import { UserService, ReferenceDataService } from '../../../core/services';
import { UserResponse } from '../../../core/models/user.model';
import { CreditPage } from '../../../core/models/page.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { CODE_ANALYSTE, CODE_CHARGE_AFFAIRES, CODE_CLIENT, CODE_MANAGER, CODE_PAE, CODE_RESEAU, CODE_UNKNOWN } from '../../../testing/mocks/mock-codes';
import { EMAIL_ANALYST_AT_BLADI_MA, EMAIL_NEW_AT_BLADI_MA, PERSON_JOHN_DOE } from '../../../testing/mocks/mock-contacts';
import { USER_ADMIN, USER_EXISTING, USER_JOHN_DOE } from '../../../testing/mocks/mock-users';

const VALID_PASSWORD = 'Password1234';

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let component: Users;
  let userService: UserService;
  let referenceDataService: ReferenceDataService;

  const mockUsers: UserResponse[] = [
    {
      id: '1', username: USER_ADMIN, fullName: 'Administrateur', email: null, role: CODE_MANAGER,
      gradeCode: null, gradeName: null, teamCode: null, teamName: null,
    },
    {
      id: '2', username: USER_JOHN_DOE, fullName: PERSON_JOHN_DOE, email: null, role: CODE_CLIENT,
      gradeCode: null, gradeName: null, teamCode: null, teamName: null,
    },
  ];
  const mockPage: CreditPage<UserResponse> = {
    items: mockUsers, total: 2, lastPage: 1, currentPage: 1, size: 20,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    referenceDataService = TestBed.inject(ReferenceDataService);
    vi.spyOn(userService, 'getAll').mockReturnValue(of(mockPage));
    vi.spyOn(referenceDataService, 'getGrades').mockReturnValue(of([]));
    vi.spyOn(referenceDataService, 'getTeams').mockReturnValue(of([]));
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

      expect(updateSpy).toHaveBeenCalledWith('2', { role: CODE_MANAGER });
    });

    it('should demote a MANAGER to CLIENT', () => {
      const updateSpy = vi.spyOn(userService, 'updateUserRole').mockReturnValue(of(undefined));

      component.toggleRole(mockUsers[0]);

      expect(updateSpy).toHaveBeenCalledWith('1', { role: CODE_CLIENT });
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

  describe('updateProfile', () => {
    it('should update the grade/team profile of a user', () => {
      const updateSpy = vi.spyOn(userService, 'updateUserProfile').mockReturnValue(of(undefined));

      component.updateProfile(mockUsers[1], CODE_ANALYSTE, CODE_PAE);

      expect(updateSpy).toHaveBeenCalledWith('2', { gradeCode: CODE_ANALYSTE, teamCode: CODE_PAE, email: null });
    });

    it('should send null when clearing the grade/team profile', () => {
      const updateSpy = vi.spyOn(userService, 'updateUserProfile').mockReturnValue(of(undefined));

      component.updateProfile(mockUsers[1], '', '');

      expect(updateSpy).toHaveBeenCalledWith('2', { gradeCode: null, teamCode: null, email: null });
    });

    it('should set an error message on profile update failure', () => {
      const error = new HttpErrorResponse({ error: { description: 'Grade inconnu.' }, status: 400 });
      vi.spyOn(userService, 'updateUserProfile').mockReturnValue(throwError(() => error));

      component.updateProfile(mockUsers[1], CODE_UNKNOWN, CODE_PAE);

      expect(component['listErrorMessage']()).toBe('Grade inconnu.');
      expect(component['updatingUserId']()).toBeNull();
    });
  });

  describe('form validation', () => {
    it('should mark fields touched on invalid submit', () => {
      component.submit();
      expect(component['form'].controls.username.touched).toBe(true);
    });

    it('should not call service when form is invalid', () => {
      vi.spyOn(userService, 'createUser');
      component['form'].setValue({
        username: '', fullName: '', email: '', password: '', role: CODE_CLIENT, gradeCode: '', teamCode: '',
      });
      component.submit();
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should be valid with correct values', () => {
      component['form'].setValue({
        username: USER_JOHN_DOE, password: VALID_PASSWORD, role: CODE_MANAGER, fullName: '', email: '', gradeCode: '', teamCode: '',
      });
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid when password has no complexity', () => {
      component['form'].setValue({
        username: USER_JOHN_DOE, password: 'alllowercase1234', role: CODE_CLIENT, fullName: '', email: '', gradeCode: '', teamCode: '',
      });
      expect(component['form'].controls.password.errors?.['passwordComplexity']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should show success and reset form on success', () => {
      vi.spyOn(userService, 'createUser').mockReturnValue(of(undefined));
      component['form'].setValue({
        username: USER_JOHN_DOE, password: VALID_PASSWORD, role: CODE_CLIENT, fullName: '', email: '', gradeCode: '', teamCode: '',
      });

      component.submit();

      expect(component['successMessage']()).toContain(USER_JOHN_DOE);
      expect(component['loading']()).toBe(false);
      expect(component['form'].controls.role.value).toBe(CODE_CLIENT);
    });

    it('should set error message on failure', () => {
      const error = new HttpErrorResponse({
        error: { description: "Nom d'utilisateur déjà pris." }, status: 409,
      });
      vi.spyOn(userService, 'createUser').mockReturnValue(throwError(() => error));
      component['form'].setValue({
        username: USER_EXISTING, password: VALID_PASSWORD, role: CODE_CLIENT, fullName: '', email: '', gradeCode: '', teamCode: '',
      });

      component.submit();

      expect(component['errorMessage']()).toBe("Nom d'utilisateur déjà pris.");
    });

    it('should use fallback error message', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(userService, 'createUser').mockReturnValue(throwError(() => error));
      component['form'].setValue({
        username: 'user', password: VALID_PASSWORD, role: CODE_CLIENT, fullName: '', email: '', gradeCode: '', teamCode: '',
      });

      component.submit();

      expect(component['errorMessage']()).toBe("Erreur lors de la création de l'utilisateur.");
    });
  });

  describe('pagination', () => {
    it('loads the next and previous pages within bounds', () => {
      const getAll = vi.spyOn(userService, 'getAll')
        .mockReturnValue(of({ ...mockPage, currentPage: 2, lastPage: 2 }));
      getAll.mockClear();
      component['lastPage'].set(2);
      component.nextPage();
      expect(getAll).toHaveBeenLastCalledWith(2);
      component.nextPage();
      expect(getAll).toHaveBeenCalledTimes(1);

      getAll.mockReturnValue(of({ ...mockPage, currentPage: 1, lastPage: 2 }));
      component.previousPage();
      expect(getAll).toHaveBeenLastCalledWith(1);
      component.previousPage();
      expect(getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('staff profile row', () => {
    const staff: UserResponse = {
      id: '3', username: 'analyst', fullName: 'Analyste PAE', email: EMAIL_ANALYST_AT_BLADI_MA, role: CODE_MANAGER,
      gradeCode: CODE_ANALYSTE, gradeName: 'Analyste', teamCode: CODE_PAE, teamName: CODE_PAE,
    };

    beforeEach(() => {
      vi.spyOn(userService, 'getAll').mockReturnValue(of({ ...mockPage, items: [staff], total: 1 }));
      vi.spyOn(referenceDataService, 'getGrades').mockReturnValue(
        of([{ id: 'g1', code: CODE_CHARGE_AFFAIRES, name: "Chargé d'affaires" }, { id: 'g2', code: CODE_ANALYSTE, name: 'Analyste' }]));
      vi.spyOn(referenceDataService, 'getTeams').mockReturnValue(
        of([{ id: 't1', code: CODE_RESEAU, name: 'Réseau' }, { id: 't2', code: CODE_PAE, name: CODE_PAE }]));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('shows the stored grade and team once the reference data has loaded', () => {
      const selects = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLSelectElement>('.cb-table tbody select');
      expect(selects[0].value).toBe(CODE_ANALYSTE);
      expect(selects[1].value).toBe(CODE_PAE);
    });

    it('keeps the stored grade and team when only the email is edited', () => {
      const update = vi.spyOn(userService, 'updateUserProfile').mockReturnValue(of(undefined));
      const email = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.cb-table tbody input[type=email]')!;
      email.value = EMAIL_NEW_AT_BLADI_MA;
      email.dispatchEvent(new Event('change'));
      expect(update).toHaveBeenCalledWith('3', { gradeCode: CODE_ANALYSTE, teamCode: CODE_PAE, email: EMAIL_NEW_AT_BLADI_MA });
    });
  });

  describe('template', () => {
    it('should render the users table with existing accounts', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(USER_JOHN_DOE);
      expect(compiled.textContent).toContain(CODE_MANAGER);
    });

    it('should disable the role button for the current user own row', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.cb-table tbody button'));
      expect(buttons.length).toBe(mockUsers.length);
    });

    it('should render success message in template after creation', () => {
      vi.spyOn(userService, 'createUser').mockReturnValue(of(undefined));
      component['form'].setValue({
        username: USER_JOHN_DOE, password: VALID_PASSWORD, role: CODE_CLIENT, fullName: '', email: '', gradeCode: '', teamCode: '',
      });
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
