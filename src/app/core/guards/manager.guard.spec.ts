import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { managerGuard } from './manager.guard';
import { TokenService } from '../services';
import { CODE_CLIENT, CODE_MANAGER } from '../../testing/mocks/mock-codes';
import { USER_ADMIN } from '../../testing/mocks/mock-users';

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
    tokenService.setAuthState(USER_ADMIN, CODE_MANAGER);
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /mortgage-credit when role is CLIENT', () => {
    tokenService.setAuthState('user', CODE_CLIENT);
    const result = runGuard();
    const expectedUrl = router.createUrlTree(['/mortgage-credit']);
    expect(result.toString()).toBe(expectedUrl.toString());
  });

  it('should redirect to /mortgage-credit when no auth state', () => {
    const result = runGuard();
    const expectedUrl = router.createUrlTree(['/mortgage-credit']);
    expect(result.toString()).toBe(expectedUrl.toString());
  });
});