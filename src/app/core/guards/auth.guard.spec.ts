import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenService } from '../services';

describe('authGuard', () => {
  let tokenService: TokenService;
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
    tokenService.clearAuthState();
  });

  it('should allow access when authenticated', () => {
    tokenService.setAuthState('john.doe', 'CLIENT');
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /login when not authenticated', () => {
    const result = runGuard();
    const expectedUrl = router.createUrlTree(['/login']);
    expect(result.toString()).toBe(expectedUrl.toString());
  });
});