import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { InvestmentCreditComponent as InvestmentCredit } from './investment-credit.component';
import { InvestmentCreditService, ActivitySectorService } from '../../core/services';
import { InvestmentCreditResponse, EnterpriseType } from '../../core/models/investment-credit.model';
import { ActivitySectorResponse } from '../../core/models/activity-sector.model';
import { provideTranslateTesting } from '../../testing/translate-testing.providers';
import { AMOUNT_0, AMOUNT_1000, AMOUNT_1000000, AMOUNT_1200000, AMOUNT_15000, AMOUNT_1500000, AMOUNT_8000000, DECIMAL_1864261_8, DECIMAL_22186_45, DECIMAL_266237_4, DECIMAL_364261_8, DECIMAL_6_75, DECIMAL_7_12 } from '../../testing/mocks/mock-amounts';
import { CODE_PME } from '../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL, EMAIL_CONTACT_AT_TEST_MA, PHONE_0612345678 } from '../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T10_00_00Z } from '../../testing/mocks/mock-dates';

describe('InvestmentCredit', () => {
  let fixture: ComponentFixture<InvestmentCredit>;
  let component: InvestmentCredit;
  let investmentCreditService: InvestmentCreditService;
  let activitySectorService: ActivitySectorService;

  const mockSectors: ActivitySectorResponse[] = [
    { id: '1', name: 'Textile', createdAt: DATE_2026_08_01T10_00_00Z },
    { id: '2', name: 'Agroalimentaire', createdAt: DATE_2026_08_01T10_00_00Z },
  ];

  const validFormValue = {
    companyName: COMPANY_ATLAS_TEXTILE_SARL,
    enterpriseType: 'PME' as const,
    sector: 'Textile',
    email: EMAIL_CONTACT_AT_TEST_MA,
    phone: PHONE_0612345678,
    amount: AMOUNT_1500000,
    duration: 84,
    annualRevenue: AMOUNT_8000000,
    companyAgeYears: 5,
    existingAnnualDebtService: AMOUNT_0,
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentCredit],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentCredit);
    component = fixture.componentInstance;
    investmentCreditService = TestBed.inject(InvestmentCreditService);
    activitySectorService = TestBed.inject(ActivitySectorService);
    vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of(mockSectors));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('activity sectors', () => {
    it('should load the sector list on init', () => {
      expect(component['activitySectors']()).toEqual(mockSectors);
    });

    it('should render the sector options in the select', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = Array.from(compiled.querySelectorAll('#sector option')).map((o) => o.textContent?.trim());
      expect(options).toEqual(['Non précisé', 'Textile', 'Agroalimentaire']);
    });
  });

  describe('form validation', () => {
    it('should mark all fields touched on invalid submit', () => {
      component.submit();
      expect(component['form'].controls.companyName.touched).toBe(true);
    });

    it('should not call service when form is invalid', () => {
      vi.spyOn(investmentCreditService, 'simulate');
      component.submit();
      expect(investmentCreditService.simulate).not.toHaveBeenCalled();
    });

    it('should be valid with correct values', () => {
      component['form'].setValue(validFormValue);
      expect(component['form'].valid).toBe(true);
    });

    it('should be invalid with amount below minimum', () => {
      component['form'].setValue({ ...validFormValue, amount: AMOUNT_1000 });
      expect(component['form'].controls.amount.errors?.['min']).toBeTruthy();
    });

    it('should be invalid without a company name', () => {
      component['form'].setValue({ ...validFormValue, companyName: '' });
      expect(component['form'].controls.companyName.errors?.['required']).toBeTruthy();
    });

    it('should be invalid without an enterprise type', () => {
      component['form'].setValue({ ...validFormValue, enterpriseType: '' as EnterpriseType });
      expect(component['form'].controls.enterpriseType.errors?.['required']).toBeTruthy();
    });
  });

  describe('submit', () => {
    it('should set result on success', () => {
      vi.spyOn(investmentCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['result']()).toEqual(mockResponse);
      expect(component['loading']()).toBe(false);
    });

    it('should omit sector from the request when left empty', () => {
      const simulateSpy = vi.spyOn(investmentCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue({ ...validFormValue, sector: '' });

      component.submit();

      const sentRequest = simulateSpy.mock.calls[0][0];
      expect('sector' in sentRequest).toBe(false);
    });

    it('should set error message on failure', () => {
      const error = new HttpErrorResponse({
        error: { description: 'Ancienneté insuffisante.' }, status: 422,
      });
      vi.spyOn(investmentCreditService, 'simulate').mockReturnValue(throwError(() => error));
      component['form'].setValue(validFormValue);

      component.submit();

      expect(component['errorMessage']()).toBe('Ancienneté insuffisante.');
    });

    it('should use fallback error message when no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(investmentCreditService, 'simulate').mockReturnValue(throwError(() => error));
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
      expect(component['form'].controls.companyName.value).toBe('');
    });
  });


  describe('template', () => {
    it('should render result block after successful submit', () => {
      vi.spyOn(investmentCreditService, 'simulate').mockReturnValue(of(mockResponse));
      component['form'].setValue(validFormValue);
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('DEM-000123');
    });

    it('should show companyName required error when touched and invalid', () => {
      component['form'].controls.companyName.markAsTouched();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('La raison sociale est requise.');
    });
  });
});
