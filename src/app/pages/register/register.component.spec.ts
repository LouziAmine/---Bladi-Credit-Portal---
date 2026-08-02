import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent as Register } from './register.component';
import { AuthService } from '../../core/services';

const VALID_PASSWORD = 'Password1234';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let component: Register;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should mark fields as touched on invalid submit', () => {
      component.submit();
      expect(component['form'].controls.username.touched).toBe(true);
    });

    it('should not call authService when form is invalid', () => {
      vi.spyOn(authService, 'register');
      component.submit();
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should be valid with correct data', () => {
      component['form'].setValue({ username: 'john.doe', password: VALID_PASSWORD });
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid when password is shorter than 12 characters', () => {
      component['form'].setValue({ username: 'john.doe', password: 'Short1a' });
      expect(component['form'].controls.password.errors?.['minlength']).toBeTruthy();
    });

    it('should be invalid when password has no uppercase letter', () => {
      component['form'].setValue({ username: 'john.doe', password: 'password1234' });
      expect(component['form'].controls.password.errors?.['passwordComplexity']).toBeTruthy();
    });

    it('should be invalid when password has no digit', () => {
      component['form'].setValue({ username: 'john.doe', password: 'PasswordOnly' });
      expect(component['form'].controls.password.errors?.['passwordComplexity']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should show success message and redirect to /login after 2s on success', () => {
      vi.spyOn(authService, 'register').mockReturnValue(of(undefined));
      const navigateSpy = vi.spyOn(router, 'navigate');
      component['form'].setValue({ username: 'john.doe', password: VALID_PASSWORD });

      component.submit();

      expect(component['successMessage']()).toContain('succès');

      vi.advanceTimersByTime(2000);

      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should set error message on registration failure', () => {
      const error = new HttpErrorResponse({
        error: { description: "Nom d'utilisateur déjà pris." },
        status: 409,
      });
      vi.spyOn(authService, 'register').mockReturnValue(throwError(() => error));
      component['form'].setValue({ username: 'existing', password: VALID_PASSWORD });

      component.submit();

      expect(component['errorMessage']()).toBe("Nom d'utilisateur déjà pris.");
      expect(component['loading']()).toBe(false);
    });

    it('should use default error message when API error has no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(authService, 'register').mockReturnValue(throwError(() => error));
      component['form'].setValue({ username: 'john', password: VALID_PASSWORD });

      component.submit();

      expect(component['errorMessage']()).toBe('Erreur lors de la création du compte.');
    });
  });

  describe('template', () => {
    it('should show username required error after invalid submit', () => {
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Le nom d'utilisateur est requis.");
    });

    it('should show password required error after invalid submit', () => {
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Le mot de passe est requis.');
    });

    it('should show username minlength error in template', () => {
      component['form'].controls.username.setValue('ab');
      component['form'].controls.username.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Minimum 3 caractères.');
    });

    it('should show password minlength error in template', () => {
      component['form'].controls.password.setValue('Short1a');
      component['form'].controls.password.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Minimum 12 caractères.');
    });

    it('should show password complexity error in template', () => {
      component['form'].controls.password.setValue('alllowercase1234');
      component['form'].controls.password.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Doit contenir une majuscule, une minuscule et un chiffre.');
    });
  });
});
