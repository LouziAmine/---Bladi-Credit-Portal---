import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HeaderComponent as Header } from './header.component';
import { AuthService, TokenService } from '../../core/services';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let authService: AuthService;
  let tokenService: TokenService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    tokenService.clearAuthState();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleMenu', () => {
    it('should toggle isMenuOpen signal', () => {
      expect(component['isMenuOpen']()).toBe(false);
      component.toggleMenu();
      expect(component['isMenuOpen']()).toBe(true);
      component.toggleMenu();
      expect(component['isMenuOpen']()).toBe(false);
    });
  });

  describe('toggleAdminMenu', () => {
    it('should toggle isAdminMenuOpen and prevent default/propagation', () => {
      const event = new MouseEvent('click');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

      expect(component['isAdminMenuOpen']()).toBe(false);
      component.toggleAdminMenu(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(component['isAdminMenuOpen']()).toBe(true);
      component.toggleAdminMenu(event);
      expect(component['isAdminMenuOpen']()).toBe(false);
    });
  });

  describe('closeAdminMenu', () => {
    it('should close the admin menu on a document click', () => {
      component.toggleAdminMenu(new MouseEvent('click'));
      expect(component['isAdminMenuOpen']()).toBe(true);
      document.dispatchEvent(new MouseEvent('click'));
      fixture.detectChanges();
      expect(component['isAdminMenuOpen']()).toBe(false);
    });
  });

  describe('closeAdminMenuOnEscape', () => {
    it('should close the admin menu on an Escape keydown', () => {
      component.toggleAdminMenu(new MouseEvent('click'));
      expect(component['isAdminMenuOpen']()).toBe(true);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(component['isAdminMenuOpen']()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to /login on success', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.logout();

      expect(authService.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to /login even on logout error', () => {
      vi.spyOn(authService, 'logout').mockReturnValue(throwError(() => new Error('network')));
      const navigateSpy = vi.spyOn(router, 'navigate');

      component.logout();

      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('template', () => {
    it('should show login and register links when not authenticated', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[routerLink="/login"]')).toBeTruthy();
      expect(compiled.querySelector('a[routerLink="/register"]')).toBeTruthy();
    });

    it('should show simulation link and logout button when authenticated as client', () => {
      tokenService.setAuthState('user', 'CLIENT');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('a[routerLink="/simulation"]')).toBeTruthy();
      expect(compiled.textContent).toContain('Déconnexion');
    });

    it('should show admin menu when authenticated as manager', () => {
      tokenService.setAuthState('admin', 'MANAGER');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.dropdown-menu')).toBeTruthy();
      expect(compiled.textContent).toContain('Administration');
    });
  });
});