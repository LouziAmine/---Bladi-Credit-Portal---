import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { managerGuard } from './manager.guard';
import { TokenService } from '../services';

describe('managerGuard', () => {
  let tokenService: TokenService;
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      managerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    tokenService.clearAuthState();
  });

  it('should allow access when role is MANAGER', () => {
    tokenService.setAuthState('admin', 'MANAGER');
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /simulation when role is CLIENT', () => {
    tokenService.setAuthState('user', 'CLIENT');
    const result = runGuard();
    const expectedUrl = router.createUrlTree(['/simulation']);
    expect(result.toString()).toBe(expectedUrl.toString());
  });

  it('should redirect to /simulation when no auth state', () => {
    const result = runGuard();
    const expectedUrl = router.createUrlTree(['/simulation']);
    expect(result.toString()).toBe(expectedUrl.toString());
  });
});