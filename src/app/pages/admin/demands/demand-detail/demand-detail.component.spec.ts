import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { DemandDetailComponent as DemandDetail } from './demand-detail.component';
import { DemandStepActionsComponent } from './demand-step-actions/demand-step-actions.component';
import { AuthService } from '../../../../core/services/auth-service/auth.service';
import { DemandService, EnterpriseService } from '../../../../core/services';
import {
  DemandAmortizationResponse,
  DemandCommentResponse,
  DemandHistoryEntryResponse,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandStepResponse,
} from '../../../../core/models/demand.model';
import { UserResponse } from '../../../../core/models/user.model';
import { provideTranslateTesting } from '../../../../testing/translate-testing.providers';
import { AMOUNT_100000, AMOUNT_11250, AMOUNT_1200000, AMOUNT_1300000, AMOUNT_1500, AMOUNT_1500000, AMOUNT_1825614, AMOUNT_260802, AMOUNT_325614, AMOUNT_8000000, DECIMAL_21733_5, DECIMAL_23233_5, DECIMAL_5_75, DECIMAL_6_15 } from '../../../../testing/mocks/mock-amounts';
import { CODE_ADVANCE, CODE_ANALYSTE, CODE_APPROVED, CODE_ASSIGN, CODE_BANK_GROUP_POLICY, CODE_CHARGE_AFFAIRES, CODE_CLASSIFICATION, CODE_CLASSIFICATION_STEP, CODE_CLASSIFY, CODE_COMMENT, CODE_CURRENT, CODE_DECISION_STEP, CODE_DONE, CODE_ENTERPRISE, CODE_INITIATION, CODE_INITIATION_STEP, CODE_INSURANCE_VALIDATION_STEP, CODE_KEEP, CODE_MANAGER, CODE_MANUAL, CODE_MORTGAGE_DECISION_STEP, CODE_NEXT, CODE_PAE, CODE_PME, CODE_PREVIOUS, CODE_REAL, CODE_RESEAU, CODE_RESP_DEPT, CODE_RISK_ANALYSIS, CODE_RISK_ANALYSIS_STEP, CODE_RISK_COMMITTEE_PROG_STEP, CODE_RISK_VALIDATION_DEPT_STEP, CODE_ROTATING, CODE_UPCOMING, REFERENCE_DEM_3F2A9C1B } from '../../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL, PERSON_RESPONSABLE_DEPARTEMENT, PERSON_RESP_DEPT, PERSON_ZINEB_KABBAJ } from '../../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T09_00_00Z, DATE_2026_08_01T10_00_00Z } from '../../../../testing/mocks/mock-dates';
import { USER_ADMIN, USER_ANALYST1 } from '../../../../testing/mocks/mock-users';

describe('DemandDetail', () => {
  let fixture: ComponentFixture<DemandDetail>;
  let component: DemandDetail;
  let demandService: DemandService;
  let enterpriseService: EnterpriseService;
  let authService: AuthService;

  const actions = (): DemandStepActionsComponent =>
    fixture.debugElement.query(By.directive(DemandStepActionsComponent)).componentInstance as DemandStepActionsComponent;

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

  const mockStep: DemandStepResponse = {
    processCode: CODE_RISK_ANALYSIS,
    processName: 'Analyse contre-risque',
    stepCode: CODE_RISK_ANALYSIS_STEP,
    stepName: 'Traitement - Analyse contre-risque',
    typicalRole: 'Analyste PAE',
    requiredGradeCode: CODE_ANALYSTE,
    requiredGradeName: 'Analyste',
    requiredTeamCode: CODE_PAE,
    requiredTeamName: 'PAE (Pôle Analyse et Engagements)',
    assignedUsername: USER_ADMIN,
    assignedBy: 'resp.dept.pae',
    enteredAt: DATE_2026_08_01T10_00_00Z,
  };

  const mockHistory: DemandHistoryEntryResponse[] = [
    {
      processCode: CODE_INITIATION,
      processName: 'Initiation du dossier',
      stepCode: CODE_INITIATION_STEP,
      stepName: 'Traitement - Initiation du dossier',
      typicalRole: "Chargé d'affaires",
      requiredGradeCode: CODE_CHARGE_AFFAIRES,
      requiredGradeName: "Chargé d'affaires",
      requiredTeamCode: CODE_RESEAU,
      requiredTeamName: 'Réseau',
      assignedUsername: USER_ADMIN,
      assignedBy: null,
      enteredAt: DATE_2026_08_01T09_00_00Z,
      exitedAt: DATE_2026_08_01T10_00_00Z,
      decisionNote: 'Dossier complet',
      decisionOutcome: CODE_APPROVED,
      returnReasonCode: null,
      recommendations: null,
      reserves: null,
      committeeType: null,
      insuranceAdiSubscribed: null,
      insuranceCoverageType: null,
      insuranceDamageSubscribed: null,
      rateOption: null,
      previousRate: null,
      appliedRate: null,
      rateChangedBy: null,
      amountOption: null,
      previousAmount: null,
      appliedAmount: null,
      durationOption: null,
      previousDuration: null,
      appliedDuration: null,
      classificationOutcome: null,
    },
  ];

  const mockPipeline: DemandPipelineStepResponse[] = [
    {
      processCode: CODE_INITIATION,
      processName: 'Initiation du dossier',
      stepCode: CODE_INITIATION_STEP,
      stepName: 'Traitement - Initiation du dossier',
      typicalRole: "Chargé d'affaires",
      requiredGradeCode: CODE_CHARGE_AFFAIRES,
      requiredGradeName: "Chargé d'affaires",
      requiredTeamCode: CODE_RESEAU,
      requiredTeamName: 'Réseau',
      globalOrder: 1001,
      status: CODE_DONE,
      enteredAt: DATE_2026_08_01T09_00_00Z,
      exitedAt: DATE_2026_08_01T10_00_00Z,
    },
    {
      processCode: CODE_RISK_ANALYSIS,
      processName: 'Analyse contre-risque',
      stepCode: CODE_RISK_ANALYSIS_STEP,
      stepName: 'Traitement - Analyse contre-risque',
      typicalRole: 'Analyste PAE',
      requiredGradeCode: CODE_ANALYSTE,
      requiredGradeName: 'Analyste',
      requiredTeamCode: CODE_PAE,
      requiredTeamName: 'PAE (Pôle Analyse et Engagements)',
      globalOrder: 3002,
      status: CODE_CURRENT,
      enteredAt: DATE_2026_08_01T10_00_00Z,
      exitedAt: null,
    },
  ];

  const mockEligibleAssignees: UserResponse[] = [
    {
      id: '2', username: USER_ANALYST1, fullName: PERSON_ZINEB_KABBAJ, email: null, role: CODE_MANAGER,
      gradeCode: CODE_ANALYSTE, gradeName: 'Analyste', teamCode: CODE_PAE, teamName: 'PAE (Pôle Analyse et Engagements)',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemandDetail);
    component = fixture.componentInstance;
    demandService = TestBed.inject(DemandService);
    enterpriseService = TestBed.inject(EnterpriseService);
    authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'getCurrentUsername').mockReturnValue(USER_ADMIN);
    vi.spyOn(enterpriseService, 'getAll').mockReturnValue(
      of({ items: [], total: 0, lastPage: 1, currentPage: 1, size: 100 }),
    );
    vi.spyOn(enterpriseService, 'matchByName').mockReturnValue(of({ matched: false, enterprise: null }));
    vi.spyOn(demandService, 'getAssignmentHistory').mockReturnValue(of([]));
  });

  function stubLoad(): void {
    vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
    vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
    vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
    vi.spyOn(demandService, 'getAssignmentHistory').mockReturnValue(of([]));
    vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
    vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
    vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
  }

  it('should create', () => {
    stubLoad();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('load', () => {
    it('should load the demand, current step and history on init', () => {
      stubLoad();
      fixture.detectChanges();
      expect(component['demand']()).toEqual(mockDemand);
      expect(component['currentStep']()).toEqual(mockStep);
      expect(component['history']()).toEqual(mockHistory);
      expect(component['loading']()).toBe(false);
    });

    it('should handle load error gracefully', () => {
      const error = new HttpErrorResponse({ error: { description: 'Dossier introuvable.' }, status: 404 });
      vi.spyOn(demandService, 'getById').mockReturnValue(throwError(() => error));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component['loading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Dossier introuvable.');
    });

    it('should use a fallback error message when the load error has no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(demandService, 'getById').mockReturnValue(throwError(() => error));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component['errorMessage']()).toBe('Impossible de charger le dossier.');
    });
  });

  describe('initial simulation (comparison snapshot)', () => {
    const classificationEntry: DemandHistoryEntryResponse = {
      ...mockHistory[0], stepCode: CODE_CLASSIFICATION_STEP, processCode: CODE_CLASSIFICATION,
      rateOption: null, previousRate: null, appliedRate: null,
      amountOption: null, previousAmount: null, appliedAmount: null,
      durationOption: null, previousDuration: null, appliedDuration: null,
      classificationOutcome: CODE_REAL,
    };
    const initiationEntry: DemandHistoryEntryResponse = {
      ...mockHistory[0], stepCode: CODE_INITIATION_STEP, processCode: CODE_INITIATION,
      rateOption: CODE_MANUAL, previousRate: 5.75, appliedRate: 10,
      amountOption: CODE_MANUAL, previousAmount: 1500000, appliedAmount: 50001,
      durationOption: CODE_MANUAL, previousDuration: 84, appliedDuration: 130,
    };

    const mockAmortization: DemandAmortizationResponse = {
      demandId: '1', reference: REFERENCE_DEM_3F2A9C1B, amount: AMOUNT_1500000, duration: 84, applicableRate: DECIMAL_5_75,
      processingFees: AMOUNT_11250, taeg: DECIMAL_6_15, amortizationSchedule: [],
      insurancePremium: AMOUNT_1500, allInMonthlyPayment: DECIMAL_23233_5, totalInsuranceCost: 126000,
      enterprise: { monthlyPayment: DECIMAL_21733_5, annualDebtService: AMOUNT_260802, totalInterest: AMOUNT_325614, totalCost: AMOUNT_1825614 },
      conventional: null,
      mourabaha: null,
    };

    it('should skip a leading classification-only history entry and use the first real decision step', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of([classificationEntry, initiationEntry]));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      const amortizationSpy = vi.spyOn(demandService, 'getAmortizationSchedule').mockReturnValue(of(mockAmortization));

      fixture.detectChanges();

      expect(amortizationSpy).toHaveBeenCalledWith('1', { rate: DECIMAL_5_75, amount: AMOUNT_1500000, duration: 84 });
    });

    it('should fall back to the demand values when no history entry recorded a decision', () => {
      stubLoad();
      fixture.detectChanges();

      expect(component['initialAmortization']()).toBeNull();
    });
  });

  describe('actionMode / onSubmit', () => {
    it('should default to ADVANCE mode', () => {
      stubLoad();
      fixture.detectChanges();
      expect(actions()['actionMode']()).toBe(CODE_ADVANCE);
    });

    it('should switch to ASSIGN mode and show the assignee select instead of the advance fields', () => {
      stubLoad();
      fixture.detectChanges();

      actions()['setActionMode'](CODE_ASSIGN);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#assignUsername')).toBeTruthy();
      expect(compiled.querySelector('#note')).toBeFalsy();
    });

    it('should delegate to assign() when submitting in ASSIGN mode', () => {
      stubLoad();
      fixture.detectChanges();
      const assignSpy = vi.spyOn(demandService, 'assign').mockReturnValue(of(mockStep));
      actions()['setActionMode'](CODE_ASSIGN);
      actions()['assignForm'].setValue({ username: USER_ANALYST1 });

      actions()['onSubmit']();

      expect(assignSpy).toHaveBeenCalledWith('1', { username: USER_ANALYST1 });
    });

    it('should delegate to advance() when submitting in ADVANCE mode', () => {
      stubLoad();
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].patchValue({ note: 'Transmis' });

      actions()['onSubmit']();

      expect(advanceSpy).toHaveBeenCalledWith('1', { note: 'Transmis', rateOption: '', amountOption: '', durationOption: '' });
    });
  });

  describe('advance', () => {
    it('should call advance with only the filled fields and reload', () => {
      stubLoad();
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].setValue({
        note: 'Transmis',
        decisionOutcome: '',
        returnReasonCode: '',
        recommendations: '',
        reserves: '',
        committeeType: '',
        insuranceAdiSubscribed: false,
        insuranceCoverageType: '',
        insuranceDamageSubscribed: false,
        assigneeUsername: '',
        rateOption: '',
        manualRate: null,
        amountOption: '',
        manualAmount: null,
        durationOption: '',
        manualDuration: null,
      });

      actions().advance();

      expect(advanceSpy).toHaveBeenCalledWith('1', { note: 'Transmis', rateOption: '', amountOption: '', durationOption: '' });
      expect(actions()['advancing']()).toBe(false);
    });

    it('should include assigneeUsername in the payload when chosen', () => {
      const notLastStepPipeline: DemandPipelineStepResponse[] = [
        ...mockPipeline,
        { ...mockPipeline[1], stepCode: CODE_RISK_VALIDATION_DEPT_STEP, status: CODE_UPCOMING, enteredAt: null },
      ];
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(notLastStepPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].setValue({
        note: '',
        decisionOutcome: '',
        returnReasonCode: '',
        recommendations: '',
        reserves: '',
        committeeType: '',
        insuranceAdiSubscribed: false,
        insuranceCoverageType: '',
        insuranceDamageSubscribed: false,
        assigneeUsername: USER_ANALYST1,
        rateOption: '',
        manualRate: null,
        amountOption: '',
        manualAmount: null,
        durationOption: '',
        manualDuration: null,
      });

      actions().advance();

      expect(advanceSpy).toHaveBeenCalledWith('1', {
        assigneeUsername: USER_ANALYST1, rateOption: '', amountOption: '', durationOption: '',
      });
    });

    it('should send assigneeUsername when the user picks it from the real select and submits the form', () => {
      const notLastStepPipeline: DemandPipelineStepResponse[] = [
        ...mockPipeline,
        { ...mockPipeline[1], stepCode: CODE_RISK_VALIDATION_DEPT_STEP, status: CODE_UPCOMING, enteredAt: null },
      ];
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(notLastStepPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));

      const compiled = fixture.nativeElement as HTMLElement;
      const select = compiled.querySelector<HTMLSelectElement>('#assigneeUsername')!;
      select.value = USER_ANALYST1;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const form = compiled.querySelector('form')!;
      form.dispatchEvent(new Event('submit'));

      expect(advanceSpy).toHaveBeenCalledWith('1', expect.objectContaining({ assigneeUsername: USER_ANALYST1 }));
    });

    for (const stepCode of [CODE_DECISION_STEP, CODE_MORTGAGE_DECISION_STEP]) {
      it(`should let the committee choose a decision on ${stepCode}`, () => {
        vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
        vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({ ...mockStep, stepCode }));
        vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
        vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
        vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
        vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
        fixture.detectChanges();

        expect(actions()['isDecisionStep']()).toBe(true);
        expect(actions()['form'].controls.decisionOutcome.enabled).toBe(true);
      });
    }

    it('should include decision/reserves/recommendations when filled on the Décision comité step', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({ ...mockStep, stepCode: CODE_DECISION_STEP }));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].setValue({
        note: 'Transmis au comité',
        decisionOutcome: CODE_APPROVED,
        returnReasonCode: 'Pièce manquante',
        recommendations: 'Suivi trimestriel',
        reserves: 'Garantie hypothécaire',
        committeeType: CODE_ROTATING,
        insuranceAdiSubscribed: false,
        insuranceCoverageType: '',
        insuranceDamageSubscribed: false,
        assigneeUsername: '',
        rateOption: '',
        manualRate: null,
        amountOption: '',
        manualAmount: null,
        durationOption: '',
        manualDuration: null,
      });

      actions().advance();

      expect(advanceSpy).toHaveBeenCalledWith('1', {
        note: 'Transmis au comité',
        decisionOutcome: CODE_APPROVED,
        returnReasonCode: 'Pièce manquante',
        recommendations: 'Suivi trimestriel',
        reserves: 'Garantie hypothécaire',
        rateOption: '',
        amountOption: '',
        durationOption: '',
      });
    });

    it('should include committeeType when filled on the Programmation du comité step', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep')
        .mockReturnValue(of({ ...mockStep, stepCode: CODE_RISK_COMMITTEE_PROG_STEP }));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].setValue({
        note: 'Programmation du comité',
        decisionOutcome: CODE_APPROVED,
        returnReasonCode: '',
        recommendations: 'Suivi trimestriel',
        reserves: 'Garantie hypothécaire',
        committeeType: CODE_ROTATING,
        insuranceAdiSubscribed: false,
        insuranceCoverageType: '',
        insuranceDamageSubscribed: false,
        assigneeUsername: '',
        rateOption: '',
        manualRate: null,
        amountOption: '',
        manualAmount: null,
        durationOption: '',
        manualDuration: null,
      });

      actions().advance();

      expect(advanceSpy).toHaveBeenCalledWith('1', {
        note: 'Programmation du comité',
        committeeType: CODE_ROTATING,
        rateOption: '',
        amountOption: '',
        durationOption: '',
      });
    });

    it('should disable decision/committee/insurance fields outside of their relevant step', () => {
      stubLoad();
      fixture.detectChanges();

      expect(actions()['form'].controls.decisionOutcome.disabled).toBe(true);
      expect(actions()['form'].controls.recommendations.disabled).toBe(true);
      expect(actions()['form'].controls.reserves.disabled).toBe(true);
      expect(actions()['form'].controls.committeeType.disabled).toBe(true);
      expect(actions()['form'].controls.insuranceAdiSubscribed.disabled).toBe(true);
      expect(actions()['form'].controls.insuranceCoverageType.disabled).toBe(true);
      expect(actions()['form'].controls.insuranceDamageSubscribed.disabled).toBe(true);
    });

    it('should include insurance fields when filled on the Souscription et validation des assurances step', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep')
        .mockReturnValue(of({ ...mockStep, stepCode: CODE_INSURANCE_VALIDATION_STEP }));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['form'].controls.insuranceAdiSubscribed.disabled).toBe(false);
      expect(actions()['isAdvanceDisabled']()).toBe(true);

      const advanceSpy = vi.spyOn(demandService, 'advance').mockReturnValue(of(mockDemand));
      actions()['form'].setValue({
        note: 'Assurances validées',
        decisionOutcome: '',
        returnReasonCode: '',
        recommendations: '',
        reserves: '',
        committeeType: '',
        insuranceAdiSubscribed: true,
        insuranceCoverageType: CODE_BANK_GROUP_POLICY,
        insuranceDamageSubscribed: false,
        assigneeUsername: '',
        rateOption: CODE_KEEP,
        manualRate: null,
        amountOption: CODE_KEEP,
        manualAmount: null,
        durationOption: CODE_KEEP,
        manualDuration: null,
      });

      expect(actions()['isAdvanceDisabled']()).toBe(false);

      actions().advance();

      expect(advanceSpy).toHaveBeenCalledWith('1', {
        note: 'Assurances validées',
        insuranceAdiSubscribed: true,
        insuranceCoverageType: CODE_BANK_GROUP_POLICY,
        insuranceDamageSubscribed: false,
        rateOption: CODE_KEEP,
        amountOption: CODE_KEEP,
        durationOption: CODE_KEEP,
      });
    });

    it('should set an error message on advance failure', () => {
      stubLoad();
      fixture.detectChanges();
      const error = new HttpErrorResponse({ error: { description: 'Étape déjà terminée.' }, status: 409 });
      vi.spyOn(demandService, 'advance').mockReturnValue(throwError(() => error));

      actions().advance();

      expect(actions()['advanceErrorMessage']()).toBe('Étape déjà terminée.');
      expect(actions()['advancing']()).toBe(false);
    });

    it('should use a fallback error message on advance failure with no description', () => {
      stubLoad();
      fixture.detectChanges();
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(demandService, 'advance').mockReturnValue(throwError(() => error));

      actions().advance();

      expect(actions()['advanceErrorMessage']()).toBe("Erreur lors de l'avancement du dossier.");
    });
  });

  describe('isLastStep / needsAssignee / assigneeOptions', () => {
    const notLastStepPipeline: DemandPipelineStepResponse[] = [
      ...mockPipeline,
      { ...mockPipeline[1], stepCode: CODE_RISK_VALIDATION_DEPT_STEP, status: CODE_UPCOMING, enteredAt: null },
    ];

    it('should treat the default mock pipeline (current step is last) as the last step', () => {
      stubLoad();
      fixture.detectChanges();

      expect(actions()['isLastStep']()).toBe(true);
      expect(actions()['needsAssignee']()).toBe(false);
    });

    it('should require an assignee when advancing forward and the current step is not last', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(notLastStepPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['isLastStep']()).toBe(false);
      expect(actions()['needsAssignee']()).toBe(true);
      expect(actions()['form'].controls.assigneeUsername.disabled).toBe(false);
    });

    it('should still require an assignee when returning from the last step', () => {
      stubLoad();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('#returnReasonCode')!;
      input.value = 'Pièce manquante';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(actions()['isLastStep']()).toBe(true);
      expect(actions()['needsAssignee']()).toBe(true);
    });

    it('should show next-step eligible assignees by default and previous-step ones when returning', () => {
      const nextUsers = [mockEligibleAssignees[0]];
      const previousUsers: UserResponse[] = [
        { id: '3', username: 'resp-dept', fullName: PERSON_RESP_DEPT, email: null, role: CODE_MANAGER,
          gradeCode: CODE_RESP_DEPT, gradeName: PERSON_RESPONSABLE_DEPARTEMENT, teamCode: CODE_PAE,
          teamName: 'PAE (Pôle Analyse et Engagements)' },
      ];
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockImplementation((_id, direction) => {
        if (direction === CODE_NEXT) {
          return of(nextUsers);
        }
        if (direction === CODE_PREVIOUS) {
          return of(previousUsers);
        }
        return of(mockEligibleAssignees);
      });
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['assigneeOptions']()).toEqual(nextUsers);

      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('#returnReasonCode')!;
      input.value = 'Pièce manquante';
      input.dispatchEvent(new Event('input'));

      expect(actions()['assigneeOptions']()).toEqual(previousUsers);
    });
  });

  describe('isAtFirstStep', () => {
    const firstStepPipeline: DemandPipelineStepResponse[] = [
      { ...mockPipeline[0], status: CODE_CURRENT, exitedAt: null },
      { ...mockPipeline[1], status: CODE_UPCOMING, enteredAt: null },
    ];

    it('should be true and disable returnReasonCode when the first pipeline step is current', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(firstStepPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['isAtFirstStep']()).toBe(true);
      expect(actions()['form'].controls.returnReasonCode.disabled).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('#returnReasonCode')!;
      expect(input.disabled).toBe(true);
      expect(compiled.textContent).toContain("le retour n'est pas possible depuis la première étape");
    });

    it('should be false and keep returnReasonCode enabled otherwise', () => {
      stubLoad();
      fixture.detectChanges();

      expect(actions()['isAtFirstStep']()).toBe(false);
      expect(actions()['form'].controls.returnReasonCode.disabled).toBe(false);
    });
  });

  describe('willReturnDossier', () => {
    it('should be false when returnReasonCode is empty', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['form'].patchValue({ returnReasonCode: '' });
      expect(actions()['willReturnDossier']()).toBe(false);
    });

    it('should be true once returnReasonCode is filled', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['form'].patchValue({ returnReasonCode: 'Pièce manquante' });
      expect(actions()['willReturnDossier']()).toBe(true);
    });

    it('should switch the submit button to "Retourner le dossier" when a return reason is set', () => {
      stubLoad();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector<HTMLInputElement>('#returnReasonCode')!;
      input.value = 'Pièce manquante';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const submitButtons = Array.from(compiled.querySelectorAll('button[type="submit"]'))
        .filter((btn) => !btn.closest('app-document-upload') && !btn.closest('app-document-request-list'));
      const advanceButton = submitButtons[submitButtons.length - 1];
      expect(advanceButton?.textContent).toContain('Retourner le dossier');
      expect(advanceButton?.classList).toContain('cb-btn--red');
    });
  });

  describe('assign', () => {
    it('should not call the service when no assignee is selected', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['assignForm'].setValue({ username: '' });
      const assignSpy = vi.spyOn(demandService, 'assign');

      actions().assign();

      expect(assignSpy).not.toHaveBeenCalled();
    });

    it('should call assign with the selected username and reload', () => {
      stubLoad();
      fixture.detectChanges();
      const assignSpy = vi.spyOn(demandService, 'assign').mockReturnValue(of(mockStep));
      actions()['assignForm'].setValue({ username: USER_ANALYST1 });

      actions().assign();

      expect(assignSpy).toHaveBeenCalledWith('1', { username: USER_ANALYST1 });
      expect(actions()['assigning']()).toBe(false);
    });

    it('should set an error message on assign failure', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['assignForm'].setValue({ username: USER_ANALYST1 });
      const error = new HttpErrorResponse({
        error: { description: 'Profil non éligible.' }, status: 403,
      });
      vi.spyOn(demandService, 'assign').mockReturnValue(throwError(() => error));

      actions().assign();

      expect(actions()['assignErrorMessage']()).toBe('Profil non éligible.');
      expect(actions()['assigning']()).toBe(false);
    });

    it('should use a fallback error message on assign failure with no description', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['assignForm'].setValue({ username: USER_ANALYST1 });
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(demandService, 'assign').mockReturnValue(throwError(() => error));

      actions().assign();

      expect(actions()['assignErrorMessage']()).toBe("Erreur lors de l'affectation du dossier.");
    });
  });

  describe('addComment', () => {
    it('should not call the service when the comment is blank', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['commentForm'].setValue({ comment: '   ' });
      const addCommentSpy = vi.spyOn(demandService, 'addComment');

      actions().addComment();

      expect(addCommentSpy).not.toHaveBeenCalled();
    });

    it('should call addComment with the trimmed comment and reload', () => {
      stubLoad();
      fixture.detectChanges();
      const mockComment: DemandCommentResponse = {
        id: '1', stepCode: CODE_RISK_ANALYSIS_STEP, stepName: 'Traitement - Analyse contre-risque',
        username: USER_ADMIN, comment: 'En attente de pièce', createdAt: DATE_2026_08_01T10_00_00Z,
      };
      const addCommentSpy = vi.spyOn(demandService, 'addComment').mockReturnValue(of(mockComment));
      actions()['commentForm'].setValue({ comment: '  En attente de pièce  ' });

      actions().addComment();

      expect(addCommentSpy).toHaveBeenCalledWith('1', { comment: 'En attente de pièce' });
      expect(actions()['commenting']()).toBe(false);
    });

    it('should set an error message on addComment failure', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['commentForm'].setValue({ comment: 'En attente de pièce' });
      const error = new HttpErrorResponse({ error: { description: 'Dossier introuvable.' }, status: 404 });
      vi.spyOn(demandService, 'addComment').mockReturnValue(throwError(() => error));

      actions().addComment();

      expect(actions()['commentErrorMessage']()).toBe('Dossier introuvable.');
      expect(actions()['commenting']()).toBe(false);
    });

    it('should use a fallback error message on addComment failure with no description', () => {
      stubLoad();
      fixture.detectChanges();
      actions()['commentForm'].setValue({ comment: 'En attente de pièce' });
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(demandService, 'addComment').mockReturnValue(throwError(() => error));

      actions().addComment();

      expect(actions()['commentErrorMessage']()).toBe("Erreur lors de l'ajout de la remarque.");
    });
  });

  describe('classification', () => {
    const classificationStep: DemandStepResponse = {
      ...mockStep, stepCode: CODE_CLASSIFICATION_STEP, stepName: 'Validation initiale du dossier avec le client',
    };

    it('should default actionMode to CLASSIFY when the current step is CLASSIFICATION_STEP', () => {
      stubLoad();
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(classificationStep));
      fixture.detectChanges();
      expect(actions()['actionMode']()).toBe(CODE_CLASSIFY);
    });

    it('should default actionMode to ADVANCE for any other step', () => {
      stubLoad();
      fixture.detectChanges();
      expect(actions()['actionMode']()).toBe(CODE_ADVANCE);
    });

    it('should switch actionMode back to ADVANCE after a reload moves past classification', () => {
      stubLoad();
      const stepSpy = vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(classificationStep));
      fixture.detectChanges();
      expect(actions()['actionMode']()).toBe(CODE_CLASSIFY);

      stepSpy.mockReturnValue(of(mockStep));
      component.load();
      fixture.detectChanges();
      expect(actions()['actionMode']()).toBe(CODE_ADVANCE);
    });
  });

  describe('template', () => {
    it('should render the company profile block (sector, company age, financial figures)', () => {
      const enrichedDemand = {
        ...mockDemand,
        enterprise: {
          ...mockDemand.enterprise!, sector: 'Textile', companyAgeYears: 5, annualRevenue: AMOUNT_8000000,
          netAnnualResult: AMOUNT_1200000, existingAnnualDebtService: AMOUNT_100000, guaranteesValue: AMOUNT_1300000,
        },
      };
      vi.spyOn(demandService, 'getById').mockReturnValue(of(enrichedDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Secteur d'activité");
      expect(compiled.textContent).toContain('Textile');
      expect(compiled.textContent).toContain("Ancienneté de l'entreprise");
      expect(compiled.textContent).toContain('5 ans');
      expect(compiled.textContent).toContain("Chiffre d'affaires annuel");
      expect(compiled.textContent).toContain('Résultat net annuel');
      expect(compiled.textContent).toContain('Service de la dette existante');
      expect(compiled.textContent).toContain('Valeur des garanties proposées');
      expect(compiled.textContent).not.toContain('Taux applicable');
    });

    it('should show a dash for the company profile fields when null', () => {
      stubLoad();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Secteur d'activité");
    });

    it('should show the CLASSIFY form and hide the advance/return button at CLASSIFICATION_STEP', () => {
      stubLoad();
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({
        ...mockStep, stepCode: CODE_CLASSIFICATION_STEP, stepName: 'Validation initiale du dossier avec le client',
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#classificationOutcomeREAL')).toBeTruthy();
      expect(compiled.textContent).not.toContain('Avancer / retourner le dossier');
    });

    it('should show the "use this enterprise" banner when a match is found for REAL', () => {
      stubLoad();
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({
        ...mockStep, stepCode: CODE_CLASSIFICATION_STEP, stepName: 'Validation initiale du dossier avec le client',
      }));
      vi.spyOn(enterpriseService, 'matchByName').mockReturnValue(of({
        matched: true,
        enterprise: {
          id: '7', name: COMPANY_ATLAS_TEXTILE_SARL, sector: 'Textile', registrationNumber: null,
          createdAt: DATE_2026_08_01T10_00_00Z,
        },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      compiled.querySelector<HTMLInputElement>('#classificationOutcomeREAL')!.click();
      fixture.detectChanges();

      expect(compiled.textContent).toContain('Cette entreprise existe déjà');
      expect(compiled.textContent).toContain(COMPANY_ATLAS_TEXTILE_SARL);
    });

    it('should show the "create enterprise" banner when no match is found for REAL', () => {
      stubLoad();
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({
        ...mockStep, stepCode: CODE_CLASSIFICATION_STEP, stepName: 'Validation initiale du dossier avec le client',
      }));
      vi.spyOn(enterpriseService, 'matchByName').mockReturnValue(of({ matched: false, enterprise: null }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      compiled.querySelector<HTMLInputElement>('#classificationOutcomeREAL')!.click();
      fixture.detectChanges();

      expect(compiled.textContent).toContain('Aucune entreprise existante ne correspond');
      expect(compiled.textContent).toContain(`Créer et rattacher « ${mockDemand.contactName} »`);
    });

    it('should disable the advance/return submit button until an assignee is chosen, when one is needed', () => {
      const notLastStepPipeline: DemandPipelineStepResponse[] = [
        ...mockPipeline,
        { ...mockPipeline[1], stepCode: CODE_RISK_VALIDATION_DEPT_STEP, status: CODE_UPCOMING, enteredAt: null },
      ];
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(notLastStepPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButtons = Array.from(compiled.querySelectorAll('button[type="submit"]'))
        .filter((btn) => !btn.closest('app-document-upload') && !btn.closest('app-document-request-list'));
      const advanceButton = submitButtons[submitButtons.length - 1] as HTMLButtonElement;
      expect(advanceButton.disabled).toBe(true);

      const select = compiled.querySelector<HTMLSelectElement>('#assigneeUsername')!;
      select.value = USER_ANALYST1;
      select.dispatchEvent(new Event('change'));
      actions()['form'].controls.rateOption.setValue(CODE_KEEP);
      actions()['form'].controls.amountOption.setValue(CODE_KEEP);
      actions()['form'].controls.durationOption.setValue(CODE_KEEP);
      fixture.detectChanges();

      expect(advanceButton.disabled).toBe(false);
    });

    it('should warn and disable advance/return when the step is assigned to someone else', () => {
      vi.spyOn(authService, 'getCurrentUsername').mockReturnValue('amine.louzi');
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({ ...mockStep, assignedUsername: 'hamza.idrissi' }));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['isAssignedToSomeoneElse']()).toBe(true);

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('hamza.idrissi');
      const submitButtons = Array.from(compiled.querySelectorAll('button[type="submit"]'))
        .filter((btn) => !btn.closest('app-document-upload') && !btn.closest('app-document-request-list'));
      const advanceButton = submitButtons[submitButtons.length - 1] as HTMLButtonElement;
      expect(advanceButton.disabled).toBe(true);
    });

    it('should not warn when the step is assigned to the current user', () => {
      vi.spyOn(authService, 'getCurrentUsername').mockReturnValue(USER_ADMIN);
      stubLoad();
      fixture.detectChanges();

      expect(actions()['isAssignedToSomeoneElse']()).toBe(false);
    });

    it('should not warn when the step is unassigned (team pool)', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of({ ...mockStep, assignedUsername: null }));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      expect(actions()['isAssignedToSomeoneElse']()).toBe(false);
    });

    it('should render the demand reference and current step', () => {
      stubLoad();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(REFERENCE_DEM_3F2A9C1B);
      expect(compiled.textContent).toContain('Analyse contre-risque');
    });

    it('should show a "Retourné" badge and the reason for a returned history entry', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of([
        {
          ...mockHistory[0],
          decisionOutcome: null,
          returnReasonCode: 'Pièce manquante',
        },
      ]));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Retourné');
      expect(compiled.textContent).toContain('Pièce manquante');
    });

    it('should hide the advance form when the demand is completed', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of({ ...mockDemand, completed: true }));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of([]));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(Array.from(compiled.querySelectorAll('button[type="submit"]'))
        .find((btn) => !btn.closest('app-document-upload') && !btn.closest('app-document-request-list'))).toBeFalsy();
    });

    it('should show the comment textarea instead of the assign/advance fields in COMMENT mode', () => {
      stubLoad();
      fixture.detectChanges();

      actions()['setActionMode'](CODE_COMMENT);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#comment')).toBeTruthy();
      expect(compiled.querySelector('#assignUsername')).toBeFalsy();
      expect(compiled.querySelector('#note')).toBeFalsy();
    });

    it('should render the comments section with author, step and text', () => {
      vi.spyOn(demandService, 'getById').mockReturnValue(of(mockDemand));
      vi.spyOn(demandService, 'getCurrentStep').mockReturnValue(of(mockStep));
      vi.spyOn(demandService, 'getHistory').mockReturnValue(of(mockHistory));
      vi.spyOn(demandService, 'getPipeline').mockReturnValue(of(mockPipeline));
      vi.spyOn(demandService, 'getEligibleAssignees').mockReturnValue(of(mockEligibleAssignees));
      vi.spyOn(demandService, 'getComments').mockReturnValue(of([
        {
          id: '1', stepCode: CODE_RISK_ANALYSIS_STEP, stepName: 'Traitement - Analyse contre-risque',
          username: USER_ANALYST1, comment: 'En attente de pièce du client.', createdAt: DATE_2026_08_01T10_00_00Z,
        },
      ]));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Commentaires');
      expect(compiled.textContent).toContain(USER_ANALYST1);
      expect(compiled.textContent).toContain('En attente de pièce du client.');
    });
  });
});
