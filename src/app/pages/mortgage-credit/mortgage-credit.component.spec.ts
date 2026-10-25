import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MortgageCreditComponent as Simulation } from './mortgage-credit.component';
import { MortgageCreditService } from '../../core/services';
import { MortgageCreditResponse } from '../../core/models/mortgage-credit.model';
import { provideTranslateTesting } from '../../testing/translate-testing.providers';
import { AMOUNT_0, AMOUNT_100, AMOUNT_1000, AMOUNT_120000, AMOUNT_15000, AMOUNT_25000, AMOUNT_3000, AMOUNT_3200, AMOUNT_5000, AMOUNT_500000, AMOUNT_600000, AMOUNT_620000, AMOUNT_7500, AMOUNT_8000, DECIMAL_3_5, DECIMAL_4_8, DECIMAL_5_5, DECIMAL_5_74 } from '../../testing/mocks/mock-amounts';
import { CODE_CONVENTIONAL, CODE_MA, CODE_MAD, CODE_MOURABAHA, CODE_SALA, REFERENCE_DEM_MTG12345 } from '../../testing/mocks/mock-codes';
import { EMAIL_KARIM_BENALI_AT_EXAMPLE_MA, PERSON_CONTRIBUTION_TAKAFUL, PERSON_KARIM_BENALI, PHONE_0612345678 } from '../../testing/mocks/mock-contacts';

describe('Simulation', () => {
  let fixture: ComponentFixture<Simulation>;
  let component: Simulation;
  let mortgageCreditService: MortgageCreditService;

  const validFormValue = {
    applicantName: PERSON_KARIM_BENALI,
    email: EMAIL_KARIM_BENALI_AT_EXAMPLE_MA,
    phone: PHONE_0612345678,
    amount: AMOUNT_500000,
    duration: 240,
    cspCode: 'SALA' as const,
    productType: 'CONVENTIONAL' as const,
    nationalityCode: CODE_MA,
    moroccanResident: true,
    propertyValue: AMOUNT_600000,
    monthlyIncome: AMOUNT_15000,
    age: 35,
    coBorrower: false,
    coBorrowerMonthlyIncome: AMOUNT_0,
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

  const mourabahaResponse: MortgageCreditResponse = {
    ...mockResponse,
    productType: CODE_MOURABAHA,
    conventional: null,
    mourabaha: {
      marginHt: 33534.55,
      vatOnMargin: 3353.45,
      marginTtc: 36888,
      monthlyPaymentTtc: 4614.8,
      takafulMonthlyContribution: 96,
      allInMonthlyPaymentTtc: 4710.8,
      totalTakafulCost: 5760,
      totalCostTtc: 536888,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Simulation],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Simulation);
    component = fixture.componentInstance;
    mortgageCreditService = TestBed.inject(MortgageCreditService);
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
      vi.spyOn(mortgageCreditService, 'simulate');
      component.submit();
      expect(mortgageCreditService.simulate).not.toHaveBeenCalled();
    });

    it('should be valid with correct values', () => {
      component['form'].setValue(validFormValue);
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid with amount below minimum', () => {
      component['form'].setValue({ ...validFormValue, amount: AMOUNT_1000 });
      expect(component['form'].controls.amount.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with age below minimum', () => {
      component['form'].setValue({ ...validFormValue, age: 10 });
      expect(component['form'].controls.age.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with propertyValue below minimum', () => {
      component['form'].setValue({ ...validFormValue, propertyValue: AMOUNT_1000 });
      expect(component['form'].controls.propertyValue.errors?.['min']).toBeTruthy();
    });

    it('should be invalid with monthlyIncome below minimum', () => {
      component['form'].setValue({ ...validFormValue, monthlyIncome: AMOUNT_100 });
      expect(component['form'].controls.monthlyIncome.errors?.['min']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should set result on success', () => {
      vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['result']()).toEqual(mockResponse);
      expect(component['loading']()).toBe(false);
    });

    it('should include coBorrowerMonthlyIncome in the request only when coBorrower is true', () => {
      const simulateSpy = vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue({ ...validFormValue, coBorrower: true, coBorrowerMonthlyIncome: AMOUNT_8000 });

      component.submit();

      expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({ coBorrower: true, coBorrowerMonthlyIncome: AMOUNT_8000 }));
    });

    it('should omit coBorrowerMonthlyIncome from the request when coBorrower is false', () => {
      const simulateSpy = vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);

      component.submit();

      const sentRequest = simulateSpy.mock.calls[0][0];
      expect('coBorrowerMonthlyIncome' in sentRequest).toBe(false);
    });

    it('should set error message on failure', () => {
      const error = new HttpErrorResponse({
        error: { description: 'Durée hors limite BAM.' }, status: 422,
      });
      vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(throwError(() => error));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['errorMessage']()).toBe('Durée hors limite BAM.');
    });

    it('should use fallback error message when no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(throwError(() => error));
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
      expect(component['form'].controls.nationalityCode.value).toBe(CODE_MA);
    });
  });

  describe('formatAmount', () => {
    it('should format number as MAD currency', () => {
      const formatted = component.formatAmount(500000);
      expect(formatted).toContain('500');
      expect(formatted).toContain(CODE_MAD);
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


  describe('template', () => {
    it('should render result block after successful submit (CONVENTIONAL)', () => {
      vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.cb-animate')).toBeTruthy();
    });

    it('should render Mourabaha-specific results branch when productType is MOURABAHA', () => {
      vi.spyOn(mortgageCreditService, 'simulate').mockReturnValue(of(mourabahaResponse));
      component['form'].setValue({ ...validFormValue, productType: CODE_MOURABAHA });
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marge TTC');
      expect(compiled.textContent).toContain(PERSON_CONTRIBUTION_TAKAFUL);
    });

    it('should show cspCode required error when touched and invalid', () => {
      component['form'].controls.cspCode.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('La CSP est requise.');
    });
  });
});
