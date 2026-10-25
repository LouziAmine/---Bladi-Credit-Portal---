import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MourabahaParametersService } from './mourabaha-parameters.service';
import {
  MourabahaParametersResponse,
  PatchMourabahaParametersRequest,
} from '../../models/mourabaha-parameters.model';
import { CreditPage } from '../../models/page.model';
import { DECIMAL_0_0004, DECIMAL_0_05, DECIMAL_0_1 } from '../../../testing/mocks/mock-amounts';
import { PERSON_NO_CONTENT } from '../../../testing/mocks/mock-contacts';

describe('MourabahaParametersService', () => {
  let service: MourabahaParametersService;
  let httpMock: HttpTestingController;

  const mockRecord: MourabahaParametersResponse = {
    id: '1',
    profitRate: DECIMAL_0_05,
    vatRate: DECIMAL_0_1,
    takafulMonthlyRate: DECIMAL_0_0004,
    active: true,
  };

  const mockPage: CreditPage<MourabahaParametersResponse> = {
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
    service = TestBed.inject(MourabahaParametersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET paginated mourabaha parameters with defaults', () => {
      service.getAll().subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/mourabaha-parameters');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });

    it('should GET paginated mourabaha parameters with custom page and size', () => {
      service.getAll(2, 10).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:8080/api/v1/mourabaha-parameters');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(mockPage);
    });
  });

  describe('getById', () => {
    it('should GET a single mourabaha parameters record by id', () => {
      service.getById('1').subscribe((record) => {
        expect(record).toEqual(mockRecord);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/mourabaha-parameters/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecord);
    });
  });

  describe('patch', () => {
    it('should PATCH mourabaha parameters by id', () => {
      const patchRequest: PatchMourabahaParametersRequest = { active: false };

      service.patch('1', patchRequest).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/mourabaha-parameters/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchRequest);
      req.flush(null, { status: 204, statusText: PERSON_NO_CONTENT });
    });
  });
});