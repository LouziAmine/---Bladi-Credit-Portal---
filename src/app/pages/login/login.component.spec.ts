import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { LoginComponent as Login } from './login.component';
import { AuthService } from '../../core/services';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should mark all fields touched on submit with invalid form', () => {
      component.submit();
      expect(component['form'].controls.username.touched).toBe(true);
      expect(component['form'].controls.password.touched).toBe(true);
    });

    it('should not call authService when form is invalid', () => {
      vi.spyOn(authService, 'login');
      component.submit();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should be invalid with empty fields', () => {
      expect(component['form'].invalid).toBe(true);
    });

    it('should be valid with correct credentials', () => {
      component['form'].setValue({ username: 'john.doe', password: 'pass123' });
      expect(component['form'].valid).toBe(true);
    });
  });

  describe('submit', () => {
    it('should call login and navigate to /simulation on success', () => {
      vi.spyOn(authService, 'login').mockReturnValue(of(undefined));
      const navigateSpy = vi.spyOn(router, 'navigate');
      component['form'].setValue({ username: 'john.doe', password: 'pass123' });

      component.submit();

      expect(authService.login).toHaveBeenCalledWith({ username: 'john.doe', password: 'pass123' });
      expect(navigateSpy).toHaveBeenCalledWith(['/simulation']);
    });

    it('should set error message on login failure (401)', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component['form'].setValue({ username: 'john.doe', password: 'wrong123' });

      component.submit();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      req.flush(
        { description: 'Identifiants invalides.' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(component['errorMessage']()).toBe('Identifiants invalides.');
      expect(component['loading']()).toBe(false);
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should use default error message when API error has no description', () => {
      component['form'].setValue({ username: 'john.doe', password: 'wrong123' });

      component.submit();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(component['errorMessage']()).toBe('Identifiants invalides.');
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
      component['form'].controls.password.setValue('abc');
      component['form'].controls.password.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Minimum 6 caractères.');
    });
  });
});