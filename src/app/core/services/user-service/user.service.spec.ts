import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { CreateUserRequest, UserResponse } from '../../models/user.model';
import { CreditPage } from '../../models/page.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET paginated users with defaults', () => {
      const mockUser: UserResponse = { id: 1, username: 'admin', role: 'MANAGER' };
      const mockPage: CreditPage<UserResponse> = { items: [mockUser], total: 1, lastPage: 1, currentPage: 1, size: 20 };

      service.getAll().subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });
  });

  describe('createUser', () => {
    it('should POST to create a user', () => {
      const request: CreateUserRequest = { username: 'john', password: 'pass123', role: 'CLIENT' };

      service.createUser(request).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(null, { status: 201, statusText: 'Created' });
    });
  });

  describe('updateUserRole', () => {
    it('should PATCH to update a user role', () => {
      service.updateUserRole(42, { role: 'MANAGER' }).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/users/42/role');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ role: 'MANAGER' });
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});