import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InvestmentCreditService } from './investment-credit.service';
import { InvestmentCreditRequest, InvestmentCreditResponse } from '../../models/investment-credit.model';
import { AMOUNT_1000000, AMOUNT_1200000, AMOUNT_15000, AMOUNT_1500000, AMOUNT_8000000, DECIMAL_1864261_8, DECIMAL_22186_45, DECIMAL_266237_4, DECIMAL_364261_8, DECIMAL_6_75, DECIMAL_7_12 } from '../../../testing/mocks/mock-amounts';
import { CODE_PME } from '../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL, EMAIL_CONTACT_AT_TEST_MA, PHONE_0612345678 } from '../../../testing/mocks/mock-contacts';

describe('InvestmentCreditService', () => {
  let service: InvestmentCreditService;
  let httpMock: HttpTestingController;

  const mockRequest: InvestmentCreditRequest = {
    companyName: COMPANY_ATLAS_TEXTILE_SARL,
    enterpriseType: CODE_PME,
    email: EMAIL_CONTACT_AT_TEST_MA,
    phone: PHONE_0612345678,
    amount: AMOUNT_1500000,
    duration: 84,
    annualRevenue: AMOUNT_8000000,
    companyAgeYears: 5,
    netAnnualResult: AMOUNT_1200000,
    guaranteesValue: AMOUNT_1000000,
  };

  const mockResponse: InvestmentCreditResponse = {
    companyName: COMPANY_ATLAS_TEXTILE_SARL,
    enterpriseType: CODE_PME,
    sector: 'Textile',
    amount: AMOUNT_1500000,
    duration: 84,
    applicableRate: DECIMAL_6_75,
    monthlyPayment: DECIMAL_22186_45,
    annualDebtService: DECIMAL_266237_4,
    totalInterest: DECIMAL_364261_8,
    totalCost: DECIMAL_1864261_8,
    processingFees: AMOUNT_15000,
    taeg: DECIMAL_7_12,
    demandReference: 'DEM-000123',
    amortizationSchedule: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvestmentCreditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('simulate', () => {
    it('should POST enterprise credit request and return response', () => {
      service.simulate(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/investment-credit');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
