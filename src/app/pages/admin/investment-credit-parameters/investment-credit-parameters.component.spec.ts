import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { InvestmentCreditParametersComponent as InvestmentCreditParameters } from './investment-credit-parameters.component';
import { InvestmentCreditParametersService } from '../../../core/services';
import { InvestmentCreditParametersResponse } from '../../../core/models/investment-credit-parameters.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_6, DECIMAL_0_001, DECIMAL_0_01, DECIMAL_0_4, DECIMAL_0_5, DECIMAL_0_8, DECIMAL_7_5 } from '../../../testing/mocks/mock-amounts';
import { CODE_MIN, CODE_PME } from '../../../testing/mocks/mock-codes';

describe('InvestmentCreditParameters', () => {
  let fixture: ComponentFixture<InvestmentCreditParameters>;
  let component: InvestmentCreditParameters;
  let parametersService: InvestmentCreditParametersService;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentCreditParameters],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentCreditParameters);
    component = fixture.componentInstance;
    parametersService = TestBed.inject(InvestmentCreditParametersService);
  });

  it('should create', () => {
    vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load parameters for every enterprise type on init', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      expect(component['parameters']().length).toBe(5);
    });

    it('should handle load error gracefully', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(throwError(() => new Error('Network')));
      fixture.detectChanges();
      expect(component['loadingList']()).toBe(false);
    });
  });

  describe('selectRecord', () => {
    it('should set selectedId and populate form', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      expect(component['selectedId']()).toBe('1');
      expect(component['form'].value.rateMin).toBe(6.0);
    });
  });

  describe('clearSelection', () => {
    it('should reset selectedId, form and messages', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      component['successMessage'].set('ok');
      component['errorMessage'].set('err');

      component.clearSelection();

      expect(component['selectedId']()).toBeNull();
      expect(component['form'].value.rateMin).toBeNull();
      expect(component['successMessage']()).toBeNull();
      expect(component['errorMessage']()).toBeNull();
    });
  });

  describe('submit', () => {
    it('should not call patch when selectedId is null', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      vi.spyOn(parametersService, 'patch');
      fixture.detectChanges();
      component.submit();
      expect(parametersService.patch).not.toHaveBeenCalled();
    });

    it('should call patch and show success', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      vi.spyOn(parametersService, 'patch').mockReturnValue(of(undefined));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['successMessage']()).toContain('succès');
    });

    it('should set error message on patch failure', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      const error = new HttpErrorResponse({
        error: { description: 'Enregistrement introuvable.' }, status: 404,
      });
      vi.spyOn(parametersService, 'patch').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['errorMessage']()).toBe('Enregistrement introuvable.');
    });

    it('should use fallback error message when no description', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(parametersService, 'patch').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['errorMessage']()).toBe('Erreur lors de la mise à jour.');
    });
  });

  describe('submit payload mapping', () => {
    it('should send undefined for fields left empty', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      const patchSpy = vi.spyOn(parametersService, 'patch').mockReturnValue(of(undefined));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      component['form'].reset({
        rateMin: null,
        rateMax: null,
        minCompanyAgeYears: null,
        maxFinancingToRevenueRatio: null,
        minGuaranteeCoverageRatio: null,
        maxDebtServiceRatio: null,
        processingFeesRatio: null,
        insurancePremiumRatio: null,
        active: null,
      });

      component.submit();

      expect(patchSpy).toHaveBeenCalledWith('1', {
        rateMin: undefined,
        rateMax: undefined,
        minCompanyAgeYears: undefined,
        maxFinancingToRevenueRatio: undefined,
        minGuaranteeCoverageRatio: undefined,
        maxDebtServiceRatio: undefined,
        processingFeesRatio: undefined,
        insurancePremiumRatio: undefined,
        active: undefined,
      });
    });
  });

  describe('strictlyPositive validator', () => {
    it('should mark field invalid for zero or negative values', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      component['form'].controls.rateMin.setValue(-1);
      expect(component['form'].controls.rateMin.errors?.['strictlyPositive']).toBeTruthy();
    });

    it('should keep field valid for positive values', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      component['form'].controls.rateMin.setValue(5);
      expect(component['form'].controls.rateMin.valid).toBe(true);
    });
  });

  describe('template', () => {
    it('should render edit form when a record is selected', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should call selectRecord when Modifier button is clicked', () => {
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(mockRecord));
      fixture.detectChanges();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector<HTMLButtonElement>('.cb-btn--ghost.cb-btn--sm');
      btn?.click();
      expect(component['selectedId']()).toBe('1');
    });

    it('should show inactive badge for inactive record', () => {
      const inactiveRecord = { ...mockRecord, active: false };
      vi.spyOn(parametersService, 'getByType').mockReturnValue(of(inactiveRecord));
      fixture.detectChanges();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Inactif');
    });
  });
});
