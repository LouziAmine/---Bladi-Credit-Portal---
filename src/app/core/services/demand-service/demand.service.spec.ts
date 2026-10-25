import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DemandService } from './demand.service';
import {
  DemandAssignmentHistoryEntryResponse,
  DemandCommentResponse,
  DemandHistoryEntryResponse,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandStepResponse,
} from '../../models/demand.model';
import { CreditPage } from '../../models/page.model';
import { UserResponse } from '../../models/user.model';
import { AMOUNT_1500000 } from '../../../testing/mocks/mock-amounts';
import { CODE_ANALYSTE, CODE_CHARGE_AFFAIRES, CODE_CURRENT, CODE_DONE, CODE_ENTERPRISE, CODE_INITIATION, CODE_INITIATION_STEP, CODE_IN_PROGRESS, CODE_MANAGER, CODE_NEXT, CODE_PAE, CODE_PME, CODE_RESEAU, CODE_RISK_ANALYSIS, CODE_RISK_ANALYSIS_STEP, REFERENCE_DEM_3F2A9C1B } from '../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL, PERSON_ZINEB_KABBAJ } from '../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T09_00_00Z, DATE_2026_08_01T10_00_00Z, DATE_2026_08_01T11_00_00Z } from '../../../testing/mocks/mock-dates';
import { USER_ADMIN, USER_ANALYST1, USER_ANALYST2 } from '../../../testing/mocks/mock-users';

describe('DemandService', () => {
  let service: DemandService;
  let httpMock: HttpTestingController;

  const mockDemand: DemandResponse = {
    id: '1',
    reference: REFERENCE_DEM_3F2A9C1B,
    demandType: CODE_ENTERPRISE,
    contactName: COMPANY_ATLAS_TEXTILE_SARL,
    amount: AMOUNT_1500000,
    duration: 84,
    createdAt: DATE_2026_08_01T10_00_00Z,
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
    assignedBy: null,
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
      decisionOutcome: null,
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

  const mockAssignmentHistory: DemandAssignmentHistoryEntryResponse[] = [
    {
      id: '1',
      stepCode: CODE_RISK_ANALYSIS_STEP,
      stepName: 'Traitement - Analyse contre-risque',
      previousUsername: USER_ANALYST1,
      newUsername: USER_ANALYST2,
      assignedBy: 'supervisor1',
      assignedAt: DATE_2026_08_01T11_00_00Z,
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
  ];

  const mockComments: DemandCommentResponse[] = [
    {
      id: '1',
      stepCode: CODE_RISK_ANALYSIS_STEP,
      stepName: 'Traitement - Analyse contre-risque',
      username: USER_ANALYST1,
      comment: 'En attente de pièce du client.',
      createdAt: DATE_2026_08_01T10_00_00Z,
    },
  ];

  const mockEligibleUsers: UserResponse[] = [
    {
      id: '2', username: USER_ANALYST1, fullName: PERSON_ZINEB_KABBAJ, email: null, role: CODE_MANAGER,
      gradeCode: CODE_ANALYSTE, gradeName: 'Analyste', teamCode: CODE_PAE, teamName: 'PAE (Pôle Analyse et Engagements)',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DemandService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should GET a paginated list of demands', () => {
      const mockPage: CreditPage<DemandResponse> = {
        items: [mockDemand], total: 1, lastPage: 1, currentPage: 1, size: 20,
      };

      service.getAll(1, 20).subscribe((response) => {
        expect(response).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        (r) => r.url === 'http://localhost:8080/api/v1/demands' && r.params.get('page') === '1' && r.params.get('size') === '20',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });

    it('should include an enterpriseId filter when provided', () => {
      const mockPage: CreditPage<DemandResponse> = {
        items: [mockDemand], total: 1, lastPage: 1, currentPage: 1, size: 20,
      };

      service.getAll(1, 20, { enterpriseId: '7' }).subscribe((response) => {
        expect(response).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        (r) => r.url === 'http://localhost:8080/api/v1/demands' && r.params.get('enterpriseId') === '7',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });

    it('should include companyName, status and amount range filters when provided', () => {
      const mockPage: CreditPage<DemandResponse> = {
        items: [mockDemand], total: 1, lastPage: 1, currentPage: 1, size: 20,
      };

      service.getAll(1, 20, {
        companyName: 'Atlas', status: CODE_IN_PROGRESS, minAmount: 100000, maxAmount: 5000000,
      }).subscribe((response) => {
        expect(response).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        (r) => r.url === 'http://localhost:8080/api/v1/demands'
          && r.params.get('companyName') === 'Atlas'
          && r.params.get('status') === CODE_IN_PROGRESS
          && r.params.get('minAmount') === '100000'
          && r.params.get('maxAmount') === '5000000',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });
  });

  describe('getById', () => {
    it('should GET a demand by id', () => {
      service.getById('1').subscribe((response) => {
        expect(response).toEqual(mockDemand);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDemand);
    });
  });

  describe('getCurrentStep', () => {
    it('should GET the current step of a demand', () => {
      service.getCurrentStep('1').subscribe((response) => {
        expect(response).toEqual(mockStep);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/current-step');
      expect(req.request.method).toBe('GET');
      req.flush(mockStep);
    });
  });

  describe('getHistory', () => {
    it('should GET the history of a demand', () => {
      service.getHistory('1').subscribe((response) => {
        expect(response).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/history');
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('getAssignmentHistory', () => {
    it('should GET the assignment history of a demand', () => {
      service.getAssignmentHistory('1').subscribe((response) => {
        expect(response).toEqual(mockAssignmentHistory);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/assignment-history');
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignmentHistory);
    });
  });

  describe('getPipeline', () => {
    it('should GET the full pipeline of a demand', () => {
      service.getPipeline('1').subscribe((response) => {
        expect(response).toEqual(mockPipeline);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/pipeline');
      expect(req.request.method).toBe('GET');
      req.flush(mockPipeline);
    });
  });

  describe('advance', () => {
    it('should POST an advance request', () => {
      const request = {
        note: 'Dossier complet', rateOption: 'KEEP' as const, amountOption: 'KEEP' as const,
        durationOption: 'KEEP' as const,
      };
      service.advance('1', request).subscribe((response) => {
        expect(response).toEqual(mockDemand);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/advance');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockDemand);
    });
  });

  describe('classify', () => {
    it('should POST a classify request', () => {
      const request = { classificationOutcome: 'REAL' as const, enterpriseId: '7', assigneeUsername: 'hamza.idrissi' };
      service.classify('1', request).subscribe((response) => {
        expect(response).toEqual(mockDemand);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/classify');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockDemand);
    });
  });

  describe('assign', () => {
    it('should POST an assign request', () => {
      service.assign('1', { username: USER_ANALYST1 }).subscribe((response) => {
        expect(response).toEqual(mockStep);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/assign');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: USER_ANALYST1 });
      req.flush(mockStep);
    });
  });

  describe('getEligibleAssignees', () => {
    it('should GET the eligible assignees of a demand, defaulting to direction=CURRENT', () => {
      service.getEligibleAssignees('1').subscribe((response) => {
        expect(response).toEqual(mockEligibleUsers);
      });

      const req = httpMock.expectOne(
        (r) => r.url === 'http://localhost:8080/api/v1/demands/1/eligible-assignees' && r.params.get('direction') === CODE_CURRENT,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockEligibleUsers);
    });

    it('should GET the eligible assignees for the given direction', () => {
      service.getEligibleAssignees('1', CODE_NEXT).subscribe((response) => {
        expect(response).toEqual(mockEligibleUsers);
      });

      const req = httpMock.expectOne(
        (r) => r.url === 'http://localhost:8080/api/v1/demands/1/eligible-assignees' && r.params.get('direction') === CODE_NEXT,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockEligibleUsers);
    });
  });

  describe('getComments', () => {
    it('should GET the comments of a demand', () => {
      service.getComments('1').subscribe((response) => {
        expect(response).toEqual(mockComments);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/comments');
      expect(req.request.method).toBe('GET');
      req.flush(mockComments);
    });
  });

  describe('addComment', () => {
    it('should POST a new comment', () => {
      service.addComment('1', { comment: 'En attente de pièce du client.' }).subscribe((response) => {
        expect(response).toEqual(mockComments[0]);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/demands/1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ comment: 'En attente de pièce du client.' });
      req.flush(mockComments[0]);
    });
  });
});
