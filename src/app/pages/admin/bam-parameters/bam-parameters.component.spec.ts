import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BamParametersComponent as BamParameters } from './bam-parameters.component';
import { BamParametersService } from '../../../core/services';
import { BamParametersResponse } from '../../../core/models/bam-parameters.model';
import { CreditPage } from '../../../core/models/page.model';

describe('BamParameters', () => {
  let fixture: ComponentFixture<BamParameters>;
  let component: BamParameters;
  let bamService: BamParametersService;

  const mockRecord: BamParametersResponse = {
    id: 1, processingFeesRatio: 0.01, minProcessingFees: 5000, maxProcessingFees: 20000,
    registrationFeeRatio: 0.015, landConservationRatio: 0.015, notaryFeeRatio: 0.01,
    ltvRatio: 0.9, maxDebtRatio: 0.4, maxAgeAtMaturity: 75, adiMonthlyRate: 0.0004, active: true,
  };

  const mockPage: CreditPage<BamParametersResponse> = {
    items: [mockRecord], total: 1, lastPage: 1, currentPage: 1, size: 20,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BamParameters],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BamParameters);
    component = fixture.componentInstance;
    bamService = TestBed.inject(BamParametersService);
  });

  it('should create', () => {
    vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load parameters on init', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      expect(component['parameters']()).toEqual([mockRecord]);
    });

    it('should handle load error gracefully', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(throwError(() => new Error('Network')));
      fixture.detectChanges();
      expect(component['loadingList']()).toBe(false);
    });
  });

  describe('selectRecord', () => {
    it('should set selectedId and populate form', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      expect(component['selectedId']()).toBe(1);
      expect(component['form'].value.processingFeesRatio).toBe(0.01);
    });
  });

  describe('clearSelection', () => {
    it('should reset selectedId, form and messages', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      component['successMessage'].set('ok');
      component['errorMessage'].set('err');

      component.clearSelection();

      expect(component['selectedId']()).toBeNull();
      expect(component['form'].value.processingFeesRatio).toBeNull();
      expect(component['successMessage']()).toBeNull();
      expect(component['errorMessage']()).toBeNull();
    });
  });

  describe('submit', () => {
    it('should not call patch when selectedId is null', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      vi.spyOn(bamService, 'patch');
      fixture.detectChanges();
      component.submit();
      expect(bamService.patch).not.toHaveBeenCalled();
    });

    it('should call patch and show success', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      vi.spyOn(bamService, 'patch').mockReturnValue(of(undefined));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['successMessage']()).toContain('succès');
    });

    it('should set error message on patch failure', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      const error = new HttpErrorResponse({
        error: { description: 'Enregistrement introuvable.' }, status: 404,
      });
      vi.spyOn(bamService, 'patch').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['errorMessage']()).toBe('Enregistrement introuvable.');
    });

    it('should use fallback error message when no description', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(bamService, 'patch').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component.selectRecord(mockRecord);

      component.submit();

      expect(component['errorMessage']()).toBe('Erreur lors de la mise à jour.');
    });
  });

  describe('strictlyPositive validator', () => {
    it('should mark field invalid for zero or negative values', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      component['form'].controls.processingFeesRatio.setValue(-1);
      expect(component['form'].controls.processingFeesRatio.errors?.['strictlyPositive']).toBeTruthy();
    });

    it('should keep field valid for positive values', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      component['form'].controls.processingFeesRatio.setValue(5);
      expect(component['form'].controls.processingFeesRatio.valid).toBe(true);
    });
  });

  describe('submit payload mapping', () => {
    it('should send undefined for fields left empty', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      const patchSpy = vi.spyOn(bamService, 'patch').mockReturnValue(of(undefined));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      component['form'].reset({
        processingFeesRatio: null,
        minProcessingFees: null,
        maxProcessingFees: null,
        registrationFeeRatio: null,
        landConservationRatio: null,
        notaryFeeRatio: null,
        ltvRatio: null,
        maxDebtRatio: null,
        maxAgeAtMaturity: null,
        adiMonthlyRate: null,
        active: null,
      });

      component.submit();

      expect(patchSpy).toHaveBeenCalledWith(1, {
        processingFeesRatio: undefined,
        minProcessingFees: undefined,
        maxProcessingFees: undefined,
        registrationFeeRatio: undefined,
        landConservationRatio: undefined,
        notaryFeeRatio: undefined,
        ltvRatio: undefined,
        maxDebtRatio: undefined,
        maxAgeAtMaturity: undefined,
        adiMonthlyRate: undefined,
        active: undefined,
      });
    });
  });

  describe('template', () => {
    it('should render edit form when a record is selected', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should call selectRecord when Modifier button is clicked', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const btn = compiled.querySelector<HTMLButtonElement>('.cb-btn--ghost.cb-btn--sm');
      btn?.click();
      expect(component['selectedId']()).toBe(1);
    });

    it('should show inactive badge for inactive record', () => {
      const inactiveRecord = { ...mockRecord, active: false };
      vi.spyOn(bamService, 'getAll').mockReturnValue(of({ ...mockPage, items: [inactiveRecord] }));
      fixture.detectChanges();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Inactif');
    });

    it('should render success message in template after patch', () => {
      vi.spyOn(bamService, 'getAll').mockReturnValue(of(mockPage));
      vi.spyOn(bamService, 'patch').mockReturnValue(of(undefined));
      fixture.detectChanges();
      component.selectRecord(mockRecord);
      component.submit();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.cb-alert--success')).toBeTruthy();
    });
  });
});