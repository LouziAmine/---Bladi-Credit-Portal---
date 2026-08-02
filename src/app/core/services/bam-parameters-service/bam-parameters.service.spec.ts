import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BamParametersService } from './bam-parameters.service';
import { BamParametersResponse, PatchBamParametersRequest } from '../../models/bam-parameters.model';
import { CreditPage } from '../../models/page.model';

describe('BamParametersService', () => {
  let service: BamParametersService;
  let httpMock: HttpTestingController;

  const mockRecord: BamParametersResponse = {
    id: 1,
    processingFeesRatio: 0.01,
    minProcessingFees: 5000,
    maxProcessingFees: 20000,
    registrationFeeRatio: 0.015,
    landConservationRatio: 0.015,
    notaryFeeRatio: 0.01,
    ltvRatio: 0.9,
    maxDebtRatio: 0.4,
    maxAgeAtMaturity: 75,
    adiMonthlyRate: 0.0004,
    active: true,
  };

  const mockPage: CreditPage<BamParametersResponse> = {
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
    service = TestBed.inject(BamParametersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET paginated BAM parameters with defaults', () => {
      service.getAll().subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/bam-parameters');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });

    it('should GET paginated BAM parameters with custom page and size', () => {
      service.getAll(2, 10).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/bam-parameters');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(mockPage);
    });
  });

  describe('getById', () => {
    it('should GET a single BAM parameters record by id', () => {
      service.getById(1).subscribe((record) => {
        expect(record).toEqual(mockRecord);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bam-parameters/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecord);
    });
  });

  describe('patch', () => {
    it('should PATCH BAM parameters by id', () => {
      const patchRequest: PatchBamParametersRequest = { active: false };

      service.patch(1, patchRequest).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/bam-parameters/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchRequest);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
