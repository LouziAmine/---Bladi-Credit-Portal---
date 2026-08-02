import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SimulationComponent as Simulation } from './simulation.component';
import { SimulationService } from '../../core/services';
import { SimulationResponse } from '../../core/models/simulation.model';

describe('Simulation', () => {
  let fixture: ComponentFixture<Simulation>;
  let component: Simulation;
  let simulationService: SimulationService;

  const validFormValue = {
    amount: 500000,
    duration: 240,
    cspCode: 'SALA' as const,
    productType: 'CONVENTIONAL' as const,
    nationalityCode: 'MA',
    moroccanResident: true,
    propertyValue: 600000,
    monthlyIncome: 15000,
    age: 35,
    coBorrower: false,
    coBorrowerMonthlyIncome: 0,
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

  const mourabahaResponse: SimulationResponse = {
    ...mockResponse,
    productType: 'MOURABAHA',
    rateMin: null,
    rateMax: null,
    monthlyPayment: null,
    adiMonthlyPremium: null,
    allInMonthlyPayment: null,
    totalInterest: null,
    totalAdiCost: null,
    monthlyPaymentMin: null,
    monthlyPaymentMax: null,
    adiMonthlyPremiumMin: null,
    adiMonthlyPremiumMax: null,
    allInMonthlyPaymentMin: null,
    allInMonthlyPaymentMax: null,
    totalInterestMin: null,
    totalInterestMax: null,
    totalAdiCostMin: null,
    totalAdiCostMax: null,
    totalCostMin: null,
    totalCostMax: null,
    marginHt: 33534.55,
    vatOnMargin: 3353.45,
    marginTtc: 36888,
    monthlyPaymentTtc: 4614.8,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Simulation],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Simulation);
    component = fixture.componentInstance;
    simulationService = TestBed.inject(SimulationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should mark all fields touched on invalid submit', () => {
      component.submit();
      expect(component['form'].controls.amount.touched).toBe(true);
    });

    it('should not call service when form is invalid', () => {
      vi.spyOn(simulationService, 'simulate');
      component.submit();
      expect(simulationService.simulate).not.toHaveBeenCalled();
    });

    it('should be valid with correct values', () => {
      component['form'].setValue(validFormValue);
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid with amount below minimum', () => {
      component['form'].setValue({ ...validFormValue, amount: 1000 });
      expect(component['form'].controls.amount.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with age below minimum', () => {
      component['form'].setValue({ ...validFormValue, age: 10 });
      expect(component['form'].controls.age.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with propertyValue below minimum', () => {
      component['form'].setValue({ ...validFormValue, propertyValue: 1000 });
      expect(component['form'].controls.propertyValue.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with monthlyIncome below minimum', () => {
      component['form'].setValue({ ...validFormValue, monthlyIncome: 100 });
      expect(component['form'].controls.monthlyIncome.errors?.['min']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should set result on success', () => {
      vi.spyOn(simulationService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['result']()).toEqual(mockResponse);
      expect(component['loading']()).toBe(false);
    });

    it('should include coBorrowerMonthlyIncome in the request only when coBorrower is true', () => {
      const simulateSpy = vi.spyOn(simulationService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue({ ...validFormValue, coBorrower: true, coBorrowerMonthlyIncome: 8000 });

      component.submit();

      expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({ coBorrower: true, coBorrowerMonthlyIncome: 8000 }));
    });

    it('should omit coBorrowerMonthlyIncome from the request when coBorrower is false', () => {
      const simulateSpy = vi.spyOn(simulationService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);

      component.submit();

      const sentRequest = simulateSpy.mock.calls[0][0];
      expect('coBorrowerMonthlyIncome' in sentRequest).toBe(false);
    });

    it('should set error message on failure', () => {
      const error = new HttpErrorResponse({
        error: { description: 'Durée hors limite BAM.' }, status: 422,
      });
      vi.spyOn(simulationService, 'simulate').mockReturnValue(throwError(() => error));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['errorMessage']()).toBe('Durée hors limite BAM.');
    });

    it('should use fallback error message when no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(simulationService, 'simulate').mockReturnValue(throwError(() => error));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['errorMessage']()).toBe('Erreur lors de la simulation.');
    });
  });

  describe('reset', () => {
    it('should reset form, result and error', () => {
      component['result'].set(mockResponse);
      component['errorMessage'].set('some error');
      component.reset();
      expect(component['result']()).toBeNull();
      expect(component['errorMessage']()).toBeNull();
      expect(component['form'].controls.nationalityCode.value).toBe('MA');
    });
  });

  describe('formatAmount', () => {
    it('should format number as MAD currency', () => {
      const formatted = component.formatAmount(500000);
      expect(formatted).toContain('500');
      expect(formatted).toContain('MAD');
    });
  });

  describe('formatPercent', () => {
    it('should format number as percentage string', () => {
      expect(component.formatPercent(3.5)).toBe('3.50 %');
    });
  });

  describe('formatDuration', () => {
    it('should return years only when months are divisible by 12', () => {
      expect(component.formatDuration(240)).toBe('20 ans');
    });

    it('should return years and remaining months when not divisible by 12', () => {
      expect(component.formatDuration(13)).toBe('1 ans 1 mois');
    });
  });

  describe('onAmountChange', () => {
    it('should update the amount form control', () => {
      const event = { target: { value: '300000' } } as unknown as Event;
      component.onAmountChange(event);
      expect(component['form'].controls.amount.value).toBe(300000);
    });
  });

  describe('onDurationChange', () => {
    it('should update the duration form control', () => {
      const event = { target: { value: '120' } } as unknown as Event;
      component.onDurationChange(event);
      expect(component['form'].controls.duration.value).toBe(120);
    });
  });

  describe('toggleSchedule', () => {
    it('should flip the showSchedule signal', () => {
      expect(component['showSchedule']()).toBe(false);
      component.toggleSchedule();
      expect(component['showSchedule']()).toBe(true);
      component.toggleSchedule();
      expect(component['showSchedule']()).toBe(false);
    });
  });

  describe('template', () => {
    it('should render result block after successful submit (CONVENTIONAL)', () => {
      vi.spyOn(simulationService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.cb-animate')).toBeTruthy();
    });

    it('should render Mourabaha-specific results branch when productType is MOURABAHA', () => {
      vi.spyOn(simulationService, 'simulate').mockReturnValue(of(mourabahaResponse));
      component['form'].setValue({ ...validFormValue, productType: 'MOURABAHA' });
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marge TTC');
    });

    it('should show cspCode required error when touched and invalid', () => {
      component['form'].controls.cspCode.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('La CSP est requise.');
    });
  });
});
