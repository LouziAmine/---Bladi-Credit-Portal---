import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service/auth.service';
import { TokenService } from '../services/token-service/token.service';

const IS_RETRY = new HttpContextToken<boolean>(() => false);

const AUTH_URLS_EXEMPT_FROM_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const AUTH_URLS_EXEMPT_FROM_REDIRECT = ['/auth/me'];

function isExemptFromRefresh(url: string): boolean {
  return AUTH_URLS_EXEMPT_FROM_REFRESH.some((path) => url.includes(path));
}

function isExemptFromRedirect(url: string): boolean {
  return AUTH_URLS_EXEMPT_FROM_REDIRECT.some((path) => url.includes(path));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isExemptFromRedirect(req.url)) {
        return throwError(() => error);
      }

      const alreadyRetried = req.context.get(IS_RETRY);
      const shouldAttemptRefresh = error.status === 401 && !alreadyRetried && !isExemptFromRefresh(req.url);

      if (!shouldAttemptRefresh) {
        if (error.status === 401) {
          tokenService.clearAuthState();
          void router.navigate(['/login']);
        }
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap(() => next(req.clone({ context: req.context.set(IS_RETRY, true) }))),
        catchError((refreshError: HttpErrorResponse) => {
          tokenService.clearAuthState();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
