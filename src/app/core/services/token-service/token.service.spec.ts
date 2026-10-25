import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';
import { CODE_CLIENT, CODE_MANAGER } from '../../../testing/mocks/mock-codes';
import { USER_ADMIN, USER_JOHN_DOE } from '../../../testing/mocks/mock-users';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setAuthState / getUsername / getUserRole', () => {
    it('should store username and role in memory', () => {
      service.setAuthState(USER_JOHN_DOE, CODE_MANAGER);
      expect(service.getUsername()).toBe(USER_JOHN_DOE);
      expect(service.getUserRole()).toBe(CODE_MANAGER);
    });
  });

  describe('clearAuthState', () => {
    it('should reset username and role to null', () => {
      service.setAuthState(USER_JOHN_DOE, CODE_CLIENT);
      service.clearAuthState();
      expect(service.getUsername()).toBeNull();
      expect(service.getUserRole()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no auth state set', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true after setAuthState', () => {
      service.setAuthState(USER_JOHN_DOE, CODE_CLIENT);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false after clearAuthState', () => {
      service.setAuthState(USER_JOHN_DOE, CODE_CLIENT);
      service.clearAuthState();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return null when no auth state set', () => {
      expect(service.getUserRole()).toBeNull();
    });

    it('should return MANAGER role', () => {
      service.setAuthState(USER_ADMIN, CODE_MANAGER);
      expect(service.getUserRole()).toBe(CODE_MANAGER);
    });

    it('should return CLIENT role', () => {
      service.setAuthState('user', CODE_CLIENT);
      expect(service.getUserRole()).toBe(CODE_CLIENT);
    });
  });
});