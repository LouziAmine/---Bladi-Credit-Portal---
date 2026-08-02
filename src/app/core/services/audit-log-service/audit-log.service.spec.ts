import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuditLogService } from './audit-log.service';
import { AuditLogEntry } from '../../models/audit-log.model';
import { CreditPage } from '../../models/page.model';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;

  const mockEntry: AuditLogEntry = {
    id: 1,
    username: 'admin',
    action: 'LOGIN',
    ipAddress: '127.0.0.1',
    details: null,
    performedAt: '2026-07-28T10:00:00Z',
  };

  const mockPage: CreditPage<AuditLogEntry> = {
    items: [mockEntry],
    total: 1,
    lastPage: 1,
    currentPage: 1,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET paginated audit log entries with defaults', () => {
      service.getAll().subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/audit-log');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });

    it('should GET paginated audit log entries with custom page and size', () => {
      service.getAll(3, 50).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/audit-log');
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('size')).toBe('50');
      req.flush(mockPage);
    });

    it('should propagate errors from the backend', () => {
      let receivedError: unknown;
      service.getAll().subscribe({ error: (err) => (receivedError = err) });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/audit-log');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(receivedError).toBeTruthy();
    });
  });
});