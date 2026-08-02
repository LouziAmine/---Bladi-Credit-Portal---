import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthUserResponse } from '../../models/auth.model';
import { TokenService } from '../token-service/token.service';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private refreshInFlight$: Observable<AuthUserResponse> | null = null;

  login(request: LoginRequest): Observable<void> {
    return this.http.post<AuthUserResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((res) => this.tokenService.setAuthState(res.username, res.role)),
      map(() => void 0),
      catchError(handleHttpError('AuthService', 'login')),
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register`, request).pipe(
      catchError(handleHttpError('AuthService', 'register')),
    );
  }

  refresh(): Observable<AuthUserResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<AuthUserResponse>(`${this.apiUrl}/refresh`, null).pipe(
        tap((res) => this.tokenService.setAuthState(res.username, res.role)),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );
    }
    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, null).pipe(
      tap(() => this.tokenService.clearAuthState()),
      catchError((error) => {
        this.tokenService.clearAuthState();
        return handleHttpError('AuthService', 'logout')(error);
      }),
    );
  }

  initAuthState(): Observable<void> {
    return this.http.get<AuthUserResponse>(`${this.apiUrl}/me`).pipe(
      tap((res) => this.tokenService.setAuthState(res.username, res.role)),
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  isManager(): boolean {
    return this.tokenService.getUserRole() === 'MANAGER';
  }

  getCurrentUsername(): string | null {
    return this.tokenService.getUsername();
  }

  getCurrentUserRole(): string | null {
    return this.tokenService.getUserRole();
  }

}
