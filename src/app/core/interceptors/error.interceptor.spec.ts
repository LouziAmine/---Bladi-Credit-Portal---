import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { TokenService } from '../services';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    tokenService.clearAuthState();
  });

  afterEach(() => httpMock.verify());

  it('should attempt a silent refresh on 401 and retry the original request', () => {
    tokenService.setAuthState('john.doe', 'CLIENT');
    let result: unknown;

    http.get('/api/test').subscribe({ next: (data) => (result = data) });

    const firstReq = httpMock.expectOne('/api/test');
    firstReq.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({ username: 'john.doe', role: 'CLIENT' });

    const retryReq = httpMock.expectOne('/api/test');
    retryReq.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(tokenService.isAuthenticated()).toBe(true);
  });

  it('should clear auth state and redirect to login when the refresh itself fails', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    tokenService.setAuthState('john.doe', 'CLIENT');

    http.get('/api/test').subscribe({ error: () => undefined });

    const firstReq = httpMock.expectOne('/api/test');
    firstReq.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    refreshReq.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not attempt a second refresh when the retried request also gets a 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    tokenService.setAuthState('john.doe', 'CLIENT');

    http.get('/api/test').subscribe({ error: () => undefined });

    const firstReq = httpMock.expectOne('/api/test');
    firstReq.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    refreshReq.flush({ username: 'john.doe', role: 'CLIENT' });

    const retryReq = httpMock.expectOne('/api/test');
    retryReq.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not attempt a refresh for exempt auth URLs and redirect immediately on 401', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    tokenService.setAuthState('john.doe', 'CLIENT');

    http.post('/api/v1/auth/login', { username: 'x', password: 'y' }).subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokenService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should not attempt a refresh or redirect on a 401 from /auth/me (anonymous bootstrap probe)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    let errorStatus = 0;

    http.get('/api/v1/auth/me').subscribe({ error: (e: { status: number }) => (errorStatus = e.status) });

    const req = httpMock.expectOne('/api/v1/auth/me');
    req.flush({ errorCode: 'CB-401' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorStatus).toBe(401);
    expect(tokenService.isAuthenticated()).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should propagate non-401 errors without redirecting', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    let errorStatus = 0;

    http.get('/api/test').subscribe({ error: (e: { status: number }) => (errorStatus = e.status) });
    const req = httpMock.expectOne('/api/test');
    req.flush({ errorCode: 'CB-500' }, { status: 500, statusText: 'Internal Server Error' });

    expect(errorStatus).toBe(500);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should pass through successful responses', () => {
    let result: unknown;

    http.get('/api/test').subscribe((data) => (result = data));
    const req = httpMock.expectOne('/api/test');
    req.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });
});
