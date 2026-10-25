import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CreditRateService } from './credit-rate.service';
import { CreditRateResponse, PatchCreditRateRequest } from '../../models/credit-rate.model';
import { CreditPage } from '../../models/page.model';
import { DECIMAL_0_032, DECIMAL_0_045 } from '../../../testing/mocks/mock-amounts';
import { CODE_SALARIE_PRIVE } from '../../../testing/mocks/mock-codes';
import { PERSON_NO_CONTENT } from '../../../testing/mocks/mock-contacts';

describe('CreditRateService', () => {
  let service: CreditRateService;
  let httpMock: HttpTestingController;

  const mockRecord: CreditRateResponse = {
    id: '1',
    cspCode: CODE_SALARIE_PRIVE,
    rateMin: DECIMAL_0_032,
    rateMax: DECIMAL_0_045,
    rateFormula: null,
    minDurationMonths: 60,
    maxDurationMonths: 300,
    active: true,
  };

  const mockPage: CreditPage<CreditRateResponse> = {
    items: [mockRecord],
    total: 1,
    lastPage: 1,
    currentPage: 1,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CreditRateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET paginated credit rates with defaults', () => {
      service.getAll().subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/credit-rates');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });

    it('should GET paginated credit rates with custom page and size', () => {
      service.getAll(2, 10).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/credit-rates');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(mockPage);
    });
  });

  describe('getById', () => {
    it('should GET a single credit rate by id', () => {
      service.getById('1').subscribe((record) => {
        expect(record).toEqual(mockRecord);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/credit-rates/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecord);
    });
  });

  describe('patch', () => {
    it('should PATCH a credit rate by id', () => {
      const patchRequest: PatchCreditRateRequest = { active: false };

      service.patch('1', patchRequest).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/credit-rates/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchRequest);
      req.flush(null, { status: 204, statusText: PERSON_NO_CONTENT });
    });
  });
});