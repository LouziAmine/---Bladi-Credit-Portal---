import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SimulationService } from './simulation.service';
import { SimulationRequest, SimulationResponse } from '../../models/simulation.model';

describe('SimulationService', () => {
  let service: SimulationService;
  let httpMock: HttpTestingController;

  const mockRequest: SimulationRequest = {
    amount: 500000,
    duration: 240,
    cspCode: 'SALA',
    productType: 'CONVENTIONAL',
    nationalityCode: 'MA',
    moroccanResident: true,
    propertyValue: 600000,
    monthlyIncome: 15000,
    age: 35,
  };

  const mockResponse: SimulationResponse = {
    amount: 500000,
    duration: 240,
    cspCode: 'SALA',
    productType: 'CONVENTIONAL',
    nationalityCode: 'MA',
    moroccanResident: true,
    age: 35,
    totalMonthlyIncome: 15000,
    applicableRate: 4.8,
    rateMin: 3.5,
    rateMax: 5.5,
    monthlyPayment: 3000,
    adiMonthlyPremium: 200,
    allInMonthlyPayment: 3200,
    totalInterest: 120000,
    totalAdiCost: 48000,
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
    totalCost: 620000,
    taeg: 5.74,
    registrationFees: 7500,
    landConservationFees: 7500,
    notaryFees: 5000,
    processingFees: 5000,
    totalFees: 25000,
    marginHt: null,
    vatOnMargin: null,
    marginTtc: null,
    monthlyPaymentTtc: null,
    amortizationSchedule: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SimulationService);
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

      const req = httpMock.expectOne('http://localhost:8080/api/v1/simulation');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
