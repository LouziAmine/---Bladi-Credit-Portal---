import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InvestmentCreditParametersService } from './investment-credit-parameters.service';
import { InvestmentCreditParametersResponse } from '../../models/investment-credit-parameters.model';
import { AMOUNT_6, DECIMAL_0_001, DECIMAL_0_01, DECIMAL_0_4, DECIMAL_0_5, DECIMAL_0_8, DECIMAL_6_2, DECIMAL_7_5 } from '../../../testing/mocks/mock-amounts';
import { CODE_MIN, CODE_PME } from '../../../testing/mocks/mock-codes';
import { PERSON_NO_CONTENT } from '../../../testing/mocks/mock-contacts';

describe('InvestmentCreditParametersService', () => {
  let service: InvestmentCreditParametersService;
  let httpMock: HttpTestingController;

  const mockRecord: InvestmentCreditParametersResponse = {
    id: '1',
    enterpriseType: CODE_PME,
    rateMin: AMOUNT_6,
    rateMax: DECIMAL_7_5,
    rateFormula: CODE_MIN,
    minCompanyAgeYears: 2,
    maxFinancingToRevenueRatio: DECIMAL_0_5,
    minGuaranteeCoverageRatio: DECIMAL_0_8,
    maxDebtServiceRatio: DECIMAL_0_4,
    processingFeesRatio: DECIMAL_0_01,
    insurancePremiumRatio: DECIMAL_0_001,
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvestmentCreditParametersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getById', () => {
    it('should GET a record by id', () => {
      service.getById('1').subscribe((response) => {
        expect(response).toEqual(mockRecord);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/investment-credit-parameters/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecord);
    });
  });

  describe('getByType', () => {
    it('should GET the active record for an enterprise type', () => {
      service.getByType(CODE_PME).subscribe((response) => {
        expect(response).toEqual(mockRecord);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/investment-credit-parameters/type/PME');
      expect(req.request.method).toBe('GET');
      req.flush(mockRecord);
    });
  });

  describe('patch', () => {
    it('should PATCH a record', () => {
      service.patch('1', { rateMin: DECIMAL_6_2 }).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/v1/investment-credit-parameters/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ rateMin: DECIMAL_6_2 });
      req.flush(null, { status: 204, statusText: PERSON_NO_CONTENT });
    });
  });
});
