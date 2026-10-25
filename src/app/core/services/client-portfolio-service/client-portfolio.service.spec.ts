import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClientPortfolioService } from './client-portfolio.service';
import {
  ClientDemandSummaryResponse,
  ClientPortfolioEnterpriseResponse,
  EnterpriseUserLinkResponse,
} from '../../models/enterprise-user-link.model';
import { CreditPage } from '../../models/page.model';
import { environment } from '../../../../environments/environment';
import { AMOUNT_1500000, DECIMAL_7_25 } from '../../../testing/mocks/mock-amounts';
import { CODE_CLIENT_CLAIM, CODE_PENDING, CODE_PME, CODE_RESPONSABLE, REFERENCE_DEM_3F2A9C1B } from '../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL } from '../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';
import { USER_JDUPONT } from '../../../testing/mocks/mock-users';

describe('ClientPortfolioService', () => {
  let service: ClientPortfolioService;
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

  const mockPortfolio: ClientPortfolioEnterpriseResponse[] = [
    { enterpriseId: '7', name: COMPANY_ATLAS_TEXTILE_SARL, sector: 'Textile', linkRole: CODE_RESPONSABLE },
  ];

  const mockDemand: ClientDemandSummaryResponse = {
    id: '1',
    reference: REFERENCE_DEM_3F2A9C1B,
    enterpriseType: CODE_PME,
    amount: AMOUNT_1500000,
    duration: 84,
    applicableRate: DECIMAL_7_25,
    createdAt: DATE_2026_08_01T10_00_00Z,
    completedAt: null,
    completed: false,
    rejected: false,
  };

  const mockDemandPage: CreditPage<ClientDemandSummaryResponse> = {
    items: [mockDemand], total: 1, lastPage: 1, currentPage: 1, size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientPortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('claimEnterprise', () => {
    it('should POST to /me/enterprise-links', () => {
      service.claimEnterprise({ registrationNumber: 'RC-45210', role: CODE_RESPONSABLE }).subscribe((link) => {
        expect(link).toEqual(mockLink);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/me/enterprise-links`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ registrationNumber: 'RC-45210', role: CODE_RESPONSABLE });
      req.flush(mockLink, { status: 201, statusText: 'Created' });
    });
  });

  describe('getMyEnterpriseLinks', () => {
    it('should GET /me/enterprise-links', () => {
      service.getMyEnterpriseLinks().subscribe((links) => {
        expect(links).toEqual([mockLink]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/me/enterprise-links`);
      expect(req.request.method).toBe('GET');
      req.flush([mockLink]);
    });
  });

  describe('getMyPortfolio', () => {
    it('should GET /me/portfolio', () => {
      service.getMyPortfolio().subscribe((portfolio) => {
        expect(portfolio).toEqual(mockPortfolio);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/me/portfolio`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPortfolio);
    });
  });

  describe('getPortfolioDemands', () => {
    it('should GET paginated demands for one enterprise', () => {
      service.getPortfolioDemands('7', 1, 20).subscribe((page) => {
        expect(page).toEqual(mockDemandPage);
      });

      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/me/portfolio/7/demands`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockDemandPage);
    });
  });
});
