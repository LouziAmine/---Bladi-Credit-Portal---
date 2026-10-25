import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EnterpriseUserLinkService } from './enterprise-user-link.service';
import { EnterpriseUserLinkResponse } from '../../models/enterprise-user-link.model';
import { CreditPage } from '../../models/page.model';
import { environment } from '../../../../environments/environment';
import { CODE_CLIENT_CLAIM, CODE_PENDING, CODE_RESPONSABLE } from '../../../testing/mocks/mock-codes';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';
import { USER_JDUPONT } from '../../../testing/mocks/mock-users';

describe('EnterpriseUserLinkService', () => {
  let service: EnterpriseUserLinkService;
  let httpMock: HttpTestingController;

  const mockLink: EnterpriseUserLinkResponse = {
    id: '1',
    enterpriseId: '7',
    userId: '5',
    role: CODE_RESPONSABLE,
    status: CODE_PENDING,
    origin: CODE_CLIENT_CLAIM,
    requestedByUsername: USER_JDUPONT,
    decidedByUsername: null,
    decidedAt: null,
    createdAt: DATE_2026_08_01T10_00_00Z, username: USER_JDUPONT,
  };

  const mockPage: CreditPage<EnterpriseUserLinkResponse> = {
    items: [mockLink], total: 1, lastPage: 1, currentPage: 1, size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnterpriseUserLinkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('inviteClient', () => {
    it('should POST to /enterprises/{id}/user-links', () => {
      service.inviteClient('7', { username: USER_JDUPONT, role: CODE_RESPONSABLE }).subscribe((link) => {
        expect(link).toEqual(mockLink);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/enterprises/7/user-links`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: USER_JDUPONT, role: CODE_RESPONSABLE });
      req.flush(mockLink, { status: 201, statusText: 'Created' });
    });
  });

  describe('getLinksForEnterprise', () => {
    it('should GET paginated links for one enterprise', () => {
      service.getLinksForEnterprise('7', 1, 20).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/enterprises/7/user-links`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });
  });

  describe('getPendingLinks', () => {
    it('should GET the pending links page (the endpoint only ever lists PENDING links)', () => {
      service.getPendingLinks(1, 20).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/enterprise-user-links`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });
  });

  describe('approve', () => {
    it('should PATCH the approve endpoint', () => {
      service.approve('1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/enterprise-user-links/1/approve`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockLink);
    });
  });

  describe('reject', () => {
    it('should PATCH the reject endpoint with a reason', () => {
      service.reject('1', { reason: 'invalide' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/enterprise-user-links/1/reject`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ reason: 'invalide' });
      req.flush(mockLink);
    });
  });

  describe('revoke', () => {
    it('should PATCH the revoke endpoint', () => {
      service.revoke('1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/enterprise-user-links/1/revoke`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockLink);
    });
  });
});
