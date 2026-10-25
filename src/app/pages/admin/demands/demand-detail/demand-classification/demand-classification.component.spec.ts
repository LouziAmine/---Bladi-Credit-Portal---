import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DemandClassificationComponent } from './demand-classification.component';
import { DemandService } from '../../../../../core/services/demand-service/demand.service';
import { EnterpriseService } from '../../../../../core/services/enterprise-service/enterprise.service';
import { DemandResponse } from '../../../../../core/models/demand.model';
import { EnterpriseResponse } from '../../../../../core/models/enterprise.model';
import { provideTranslateTesting } from '../../../../../testing/translate-testing.providers';
import { AMOUNT_1500000 } from '../../../../../testing/mocks/mock-amounts';
import { CODE_ENTERPRISE, CODE_FAKE, CODE_MORTGAGE, CODE_PME, CODE_REAL, REFERENCE_DEM_3F2A9C1B } from '../../../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL } from '../../../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T09_00_00Z, DATE_2026_08_01T10_00_00Z } from '../../../../../testing/mocks/mock-dates';
import { USER_ANALYST1 } from '../../../../../testing/mocks/mock-users';

describe('DemandClassificationComponent', () => {
  let fixture: ComponentFixture<DemandClassificationComponent>;
  let component: DemandClassificationComponent;
  let demandService: DemandService;
  let enterpriseService: EnterpriseService;

  const mockDemand: DemandResponse = {
    id: '1',
    reference: REFERENCE_DEM_3F2A9C1B,
    demandType: CODE_ENTERPRISE,
    contactName: COMPANY_ATLAS_TEXTILE_SARL,
    amount: AMOUNT_1500000,
    duration: 84,
    createdAt: DATE_2026_08_01T09_00_00Z,
    completedAt: null,
    completed: false,
    applicableRate: null,
    contactEmail: null,
    contactPhone: null,
    currentProcessName: null,
    currentStepName: null,
    rejected: false,
    rejectedAt: null,
    enterprise: {
      enterpriseType: CODE_PME,
      enterpriseId: null,
      sector: null,
      companyAgeYears: null,
      annualRevenue: null,
      netAnnualResult: null,
      existingAnnualDebtService: null,
      guaranteesValue: null,
    },
    mortgage: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandClassificationComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    demandService = TestBed.inject(DemandService);
    enterpriseService = TestBed.inject(EnterpriseService);
    vi.spyOn(enterpriseService, 'getAll').mockReturnValue(
      of({ items: [], total: 0, lastPage: 0, currentPage: 1, size: 100 }));
    vi.spyOn(enterpriseService, 'matchByName').mockReturnValue(of({ matched: false, enterprise: null }));

    fixture = TestBed.createComponent(DemandClassificationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('demand', mockDemand);
  });

  it('should emit classified once the demand is classified', () => {
    fixture.detectChanges();
    vi.spyOn(demandService, 'classify').mockReturnValue(of(mockDemand));
    const emitted: void[] = [];
    component.classified.subscribe(() => emitted.push(undefined));
    component['classifyForm'].patchValue({ classificationOutcome: CODE_FAKE });

    component.classify();

    expect(emitted.length).toBe(1);
  });

  it('should skip the enterprise match for a MORTGAGE demand', () => {
    fixture.componentRef.setInput('demand', { ...mockDemand, demandType: CODE_MORTGAGE, enterprise: null });
    fixture.detectChanges();
    const matchSpy = vi.spyOn(enterpriseService, 'matchByName');

    component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

    expect(matchSpy).not.toHaveBeenCalled();
  });

  it('should not call the service when no outcome is selected', () => {
    fixture.detectChanges();
    const classifySpy = vi.spyOn(demandService, 'classify');

    component.classify();

    expect(classifySpy).not.toHaveBeenCalled();
  });

  it('should call classify with enterpriseId and assigneeUsername for a REAL outcome', () => {
    fixture.detectChanges();
    const classifySpy = vi.spyOn(demandService, 'classify').mockReturnValue(of(mockDemand));
    component['classifyForm'].setValue({
      classificationOutcome: CODE_REAL, enterpriseId: '7', assigneeUsername: USER_ANALYST1, note: 'Client confirmé',
      clientRib: null,
    });

    component.classify();

    expect(classifySpy).toHaveBeenCalledWith('1', {
      classificationOutcome: CODE_REAL, enterpriseId: '7', assigneeUsername: USER_ANALYST1, note: 'Client confirmé',
    });
    expect(component['classifying']()).toBe(false);
  });

  it('should call classify without enterpriseId/assigneeUsername for a FAKE outcome', () => {
    fixture.detectChanges();
    const classifySpy = vi.spyOn(demandService, 'classify').mockReturnValue(of(mockDemand));
    component['classifyForm'].setValue({
      classificationOutcome: CODE_FAKE, enterpriseId: null, assigneeUsername: '', note: 'Client injoignable',
      clientRib: null,
    });

    component.classify();

    expect(classifySpy).toHaveBeenCalledWith('1', { classificationOutcome: CODE_FAKE, note: 'Client injoignable' });
  });

  it('should set an error message on classify failure', () => {
    fixture.detectChanges();
    component['classifyForm'].setValue({
      classificationOutcome: CODE_FAKE, enterpriseId: null, assigneeUsername: '', note: '',
      clientRib: null,
    });
    const error = new HttpErrorResponse({ error: { description: 'Dossier introuvable.' }, status: 404 });
    vi.spyOn(demandService, 'classify').mockReturnValue(throwError(() => error));

    component.classify();

    expect(component['classifyErrorMessage']()).toBe('Dossier introuvable.');
    expect(component['classifying']()).toBe(false);
  });

  describe('isClassifyDisabled', () => {
    it('should be disabled with no outcome selected', () => {
      fixture.detectChanges();
      expect(component['isClassifyDisabled']()).toBe(true);
    });

    it('should be disabled for REAL without an enterprise or assignee', () => {
      fixture.detectChanges();
      component['classifyForm'].patchValue({ classificationOutcome: CODE_REAL });
      expect(component['isClassifyDisabled']()).toBe(true);
    });

    it('should be enabled for REAL once an enterprise and assignee are chosen', () => {
      fixture.detectChanges();
      component['classifyForm'].patchValue({
        classificationOutcome: CODE_REAL, enterpriseId: '7', assigneeUsername: USER_ANALYST1,
      });
      expect(component['isClassifyDisabled']()).toBe(false);
    });

    it('should be enabled for FAKE with no enterprise or assignee needed', () => {
      fixture.detectChanges();
      component['classifyForm'].patchValue({ classificationOutcome: CODE_FAKE });
      expect(component['isClassifyDisabled']()).toBe(false);
    });
  });

  describe('enterprise name matching', () => {
    const mockMatchedEnterprise: EnterpriseResponse = {
      id: '7', name: COMPANY_ATLAS_TEXTILE_SARL, sector: 'Textile', registrationNumber: null,
      createdAt: DATE_2026_08_01T10_00_00Z,
    };

    it('should check for a matching enterprise once when REAL is selected', () => {
      fixture.detectChanges();
      const matchSpy = vi.spyOn(enterpriseService, 'matchByName')
        .mockReturnValue(of({ matched: false, enterprise: null }));

      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

      expect(matchSpy).toHaveBeenCalledWith(mockDemand.contactName);
      expect(component['checkingClassifyMatch']()).toBe(false);
      expect(component['classifyMatch']()).toEqual({ matched: false, enterprise: null });
    });

    it('should not re-check once a result is already cached', () => {
      fixture.detectChanges();
      const matchSpy = vi.spyOn(enterpriseService, 'matchByName')
        .mockReturnValue(of({ matched: false, enterprise: null }));

      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);
      component['classifyForm'].controls.classificationOutcome.setValue(CODE_FAKE);
      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

      expect(matchSpy).toHaveBeenCalledTimes(1);
    });

    it('should pre-select the matched enterprise on useMatchedEnterprise', () => {
      vi.spyOn(enterpriseService, 'matchByName').mockReturnValue(
        of({ matched: true, enterprise: mockMatchedEnterprise }),
      );
      fixture.detectChanges();
      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

      component['useMatchedEnterprise']();

      expect(component['classifyForm'].value.enterpriseId).toBe('7');
    });

    it('should create and attach a new enterprise from the demand company name', () => {
      fixture.detectChanges();
      const createSpy = vi.spyOn(enterpriseService, 'create').mockReturnValue(of(mockMatchedEnterprise));
      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

      component['createAndAttachEnterprise']();

      expect(createSpy).toHaveBeenCalledWith({ name: mockDemand.contactName });
      expect(component['creatingEnterpriseFromMatch']()).toBe(false);
      expect(component['classifyForm'].value.enterpriseId).toBe('7');
      expect(component['enterprises']()).toContainEqual(mockMatchedEnterprise);
      expect(component['classifyMatch']()).toEqual({ matched: true, enterprise: mockMatchedEnterprise });
    });

    it('should set an error message when createAndAttachEnterprise fails', () => {
      fixture.detectChanges();
      const error = new HttpErrorResponse({ error: { description: 'Nom déjà utilisé.' }, status: 409 });
      vi.spyOn(enterpriseService, 'create').mockReturnValue(throwError(() => error));
      component['classifyForm'].controls.classificationOutcome.setValue(CODE_REAL);

      component['createAndAttachEnterprise']();

      expect(component['classifyMatchErrorMessage']()).toBe('Nom déjà utilisé.');
      expect(component['creatingEnterpriseFromMatch']()).toBe(false);
    });
  });
});
