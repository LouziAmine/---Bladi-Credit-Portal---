import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenService } from '../token-service/token.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    tokenService.clearAuthState();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST credentials and store username + role in memory', () => {
      let completed = false;
      service.login({ username: 'user', password: 'pass' }).subscribe({ complete: () => { completed = true; } });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush({ username: 'user', role: 'CLIENT' });

      expect(tokenService.getUsername()).toBe('user');
      expect(tokenService.getUserRole()).toBe('CLIENT');
      expect(completed).toBe(true);
    });

    it('should store MANAGER role correctly', () => {
      service.login({ username: 'admin', password: 'pass' }).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
      req.flush({ username: 'admin', role: 'MANAGER' });

      expect(tokenService.getUserRole()).toBe('MANAGER');
    });
  });

  describe('refresh', () => {
    it('should POST to /auth/refresh and update auth state', () => {
      service.refresh().subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush({ username: 'john.doe', role: 'MANAGER' });

      expect(tokenService.getUsername()).toBe('john.doe');
      expect(tokenService.getUserRole()).toBe('MANAGER');
    });

    it('should share a single in-flight request across concurrent callers', () => {
      let firstResult: unknown;
      let secondResult: unknown;

      service.refresh().subscribe((res) => (firstResult = res));
      service.refresh().subscribe((res) => (secondResult = res));

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
      req.flush({ username: 'john.doe', role: 'CLIENT' });

      expect(firstResult).toEqual({ username: 'john.doe', role: 'CLIENT' });
      expect(secondResult).toEqual({ username: 'john.doe', role: 'CLIENT' });
    });

    it('should trigger a new request after the previous refresh settled', () => {
      service.refresh().subscribe();
      httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh').flush({ username: 'a', role: 'CLIENT' });

      service.refresh().subscribe();
      const secondReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
      secondReq.flush({ username: 'a', role: 'CLIENT' });
    });
  });

  describe('register', () => {
    it('should POST registration data', () => {
      service.register({ username: 'user', password: 'pass' }).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 201, statusText: 'Created' });
    });
  });

  describe('logout', () => {
    it('should POST logout without Authorization header and clear auth state', () => {
      tokenService.setAuthState('user', 'CLIENT');

      service.logout().subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(tokenService.isAuthenticated()).toBe(false);
    });

    it('should still clear auth state and propagate the error when the backend call fails', () => {
      tokenService.setAuthState('user', 'CLIENT');
      let receivedError: unknown;

      service.logout().subscribe({ error: (err) => (receivedError = err) });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(tokenService.isAuthenticated()).toBe(false);
      expect(receivedError).toBeTruthy();
    });
  });

  describe('initAuthState', () => {
    it('should GET /me and restore auth state from cookie', () => {
      service.initAuthState().subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({ username: 'john.doe', role: 'MANAGER' });

      expect(tokenService.getUsername()).toBe('john.doe');
      expect(tokenService.getUserRole()).toBe('MANAGER');
    });

    it('should resolve without throwing when not authenticated (no valid session cookie)', () => {
      let completed = false;
      service.initAuthState().subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/me');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(completed).toBe(true);
      expect(tokenService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no auth state', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when auth state is set', () => {
      tokenService.setAuthState('user', 'CLIENT');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('isManager', () => {
    it('should return false when no auth state', () => {
      expect(service.isManager()).toBe(false);
    });

    it('should return true when role is MANAGER', () => {
      tokenService.setAuthState('admin', 'MANAGER');
      expect(service.isManager()).toBe(true);
    });

    it('should return false when role is CLIENT', () => {
      tokenService.setAuthState('user', 'CLIENT');
      expect(service.isManager()).toBe(false);
    });
  });

  describe('getCurrentUsername / getCurrentUserRole', () => {
    it('should return null when no auth state', () => {
      expect(service.getCurrentUsername()).toBeNull();
      expect(service.getCurrentUserRole()).toBeNull();
    });

    it('should return username and role from auth state', () => {
      tokenService.setAuthState('john.doe', 'CLIENT');
      expect(service.getCurrentUsername()).toBe('john.doe');
      expect(service.getCurrentUserRole()).toBe('CLIENT');
    });
  });
});