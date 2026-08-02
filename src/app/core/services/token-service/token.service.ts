import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _username = signal<string | null>(null);
  private readonly _role = signal<string | null>(null);

  setAuthState(username: string, role: string): void {
    this._username.set(username);
    this._role.set(role);
  }

  clearAuthState(): void {
    this._username.set(null);
    this._role.set(null);
  }

  isAuthenticated(): boolean {
    return this._username() !== null;
  }

  getUserRole(): string | null {
    return this._role();
  }

  getUsername(): string | null {
    return this._username();
  }
}