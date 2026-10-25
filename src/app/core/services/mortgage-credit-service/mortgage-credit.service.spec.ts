import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MortgageCreditService } from './mortgage-credit.service';
import { MortgageCreditRequest, MortgageCreditResponse } from '../../models/mortgage-credit.model';
import { AMOUNT_120000, AMOUNT_15000, AMOUNT_25000, AMOUNT_3000, AMOUNT_3200, AMOUNT_5000, AMOUNT_500000, AMOUNT_600000, AMOUNT_620000, AMOUNT_7500, DECIMAL_3_5, DECIMAL_4_8, DECIMAL_5_5, DECIMAL_5_74 } from '../../../testing/mocks/mock-amounts';
import { CODE_CONVENTIONAL, CODE_MA, CODE_SALA, REFERENCE_DEM_MTG12345 } from '../../../testing/mocks/mock-codes';
import { EMAIL_KARIM_BENALI_AT_EXAMPLE_MA, PERSON_KARIM_BENALI, PHONE_0612345678 } from '../../../testing/mocks/mock-contacts';

describe('MortgageCreditService', () => {
  let service: MortgageCreditService;
  let httpMock: HttpTestingController;

  const mockRequest: MortgageCreditRequest = {
    applicantName: PERSON_KARIM_BENALI,
    email: EMAIL_KARIM_BENALI_AT_EXAMPLE_MA,
    phone: PHONE_0612345678,
    amount: AMOUNT_500000,
    duration: 240,
    cspCode: CODE_SALA,
    productType: CODE_CONVENTIONAL,
    nationalityCode: CODE_MA,
    moroccanResident: true,
    propertyValue: AMOUNT_600000,
    monthlyIncome: AMOUNT_15000,
    age: 35,
  };

  const mockResponse: MortgageCreditResponse = {
    amount: AMOUNT_500000,
    duration: 240,
    cspCode: CODE_SALA,
    productType: CODE_CONVENTIONAL,
    nationalityCode: CODE_MA,
    moroccanResident: true,
    age: 35,
    totalMonthlyIncome: AMOUNT_15000,
    applicableRate: DECIMAL_4_8,
    taeg: DECIMAL_5_74,
    registrationFees: AMOUNT_7500,
    landConservationFees: AMOUNT_7500,
    notaryFees: AMOUNT_5000,
    processingFees: AMOUNT_5000,
    totalFees: AMOUNT_25000,
    conventional: {
      rateMin: DECIMAL_3_5,
      rateMax: DECIMAL_5_5,
      monthlyPayment: AMOUNT_3000,
      adiMonthlyPremium: 200,
      allInMonthlyPayment: AMOUNT_3200,
      totalInterest: AMOUNT_120000,
      totalAdiCost: 48000,
      totalCost: AMOUNT_620000,
      monthlyPaymentMin: 2800,
      monthlyPaymentMax: 3200,
      adiMonthlyPremiumMin: 200,
      adiMonthlyPremiumMax: 232,
      allInMonthlyPaymentMin: 3000,
      allInMonthlyPaymentMax: 3432,
      totalInterestMin: 72000,
      totalInterestMax: 168000,
      totalAdiCostMin: 48000,
      totalAdiCostMax: 55680,
      totalCostMin: 572000,
      totalCostMax: 668000,
    },
    mourabaha: null,
    amortizationSchedule: [],
    demandReference: REFERENCE_DEM_MTG12345,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MortgageCreditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('simulate', () => {
    it('should POST simulation request and return response', () => {
      service.simulate(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/mortgage-credit');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
