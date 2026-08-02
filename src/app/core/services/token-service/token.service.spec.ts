import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

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
      service.setAuthState('john.doe', 'MANAGER');
      expect(service.getUsername()).toBe('john.doe');
      expect(service.getUserRole()).toBe('MANAGER');
    });
  });

  describe('clearAuthState', () => {
    it('should reset username and role to null', () => {
      service.setAuthState('john.doe', 'CLIENT');
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
      service.setAuthState('john.doe', 'CLIENT');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false after clearAuthState', () => {
      service.setAuthState('john.doe', 'CLIENT');
      service.clearAuthState();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return null when no auth state set', () => {
      expect(service.getUserRole()).toBeNull();
    });

    it('should return MANAGER role', () => {
      service.setAuthState('admin', 'MANAGER');
      expect(service.getUserRole()).toBe('MANAGER');
    });

    it('should return CLIENT role', () => {
      service.setAuthState('user', 'CLIENT');
      expect(service.getUserRole()).toBe('CLIENT');
    });
  });
});