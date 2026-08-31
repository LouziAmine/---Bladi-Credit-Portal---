import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DemandsComponent as Demands } from './demands.component';
import { DemandService, EnterpriseService } from '../../../core/services';
import { DemandResponse } from '../../../core/models/demand.model';
import { EnterpriseResponse } from '../../../core/models/enterprise.model';
import { CreditPage } from '../../../core/models/page.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_1500000 } from '../../../testing/mocks/mock-amounts';
import { CODE_ENTERPRISE, CODE_PME, REFERENCE_DEM_3F2A9C1B } from '../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL } from '../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T10_00_00Z, DATE_2026_08_20T10_00_00Z } from '../../../testing/mocks/mock-dates';

describe('Demands', () => {
  let fixture: ComponentFixture<Demands>;
  let component: Demands;
  let demandService: DemandService;
  let enterpriseService: EnterpriseService;

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

  const mockPage: CreditPage<DemandResponse> = {
    items: [mockDemand], total: 1, lastPage: 2, currentPage: 1, size: 20,
  };

  function setup(queryParamMap: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Demands],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParamMap) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Demands);
    component = fixture.componentInstance;
    demandService = TestBed.inject(DemandService);
    enterpriseService = TestBed.inject(EnterpriseService);
  }

  beforeEach(() => {
    setup();
  });

  it('should create', () => {
    vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the first page on init', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      expect(component['demands']()).toEqual([mockDemand]);
      expect(component['total']()).toBe(1);
    });

    it('should handle load error gracefully', () => {
      const error = new HttpErrorResponse({ error: { description: 'Erreur serveur.' }, status: 500 });
      vi.spyOn(demandService, 'getAll').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component['loading']()).toBe(false);
      expect(component['errorMessage']()).toBe('Erreur serveur.');
    });

    it('should use a fallback error message when there is no description', () => {
      const error = new HttpErrorResponse({ error: {}, status: 500 });
      vi.spyOn(demandService, 'getAll').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component['errorMessage']()).toBe('Impossible de charger les dossiers.');
    });
  });

  describe('pagination', () => {
    it('should go to previous page when not on page 1', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of({ ...mockPage, currentPage: 2 }));
      fixture.detectChanges();
      const spy = vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      component.previousPage();
      expect(spy).toHaveBeenCalledWith(1, 20, undefined);
    });

    it('should not go to previous page when already on page 1', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const spy = vi.spyOn(demandService, 'getAll');
      spy.mockClear();
      component.previousPage();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should go to next page when not on last page', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const spy = vi.spyOn(demandService, 'getAll').mockReturnValue(of({ ...mockPage, currentPage: 2 }));
      component.nextPage();
      expect(spy).toHaveBeenCalledWith(2, 20, undefined);
    });

    it('should not go to next page when already on last page', () => {
      const lastPageResult = { ...mockPage, currentPage: 2, lastPage: 2 };
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(lastPageResult));
      fixture.detectChanges();
      const spy = vi.spyOn(demandService, 'getAll');
      spy.mockClear();
      component.nextPage();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should render empty state when there are no demands', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of({ ...mockPage, items: [], total: 0 }));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Aucun dossier enregistré');
    });

    it('should render the demand reference in the table', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(REFERENCE_DEM_3F2A9C1B);
    });

    it('should render the current step chip when the demand carries one', () => {
      const withStep = { ...mockDemand, currentProcessName: 'Analyse contre-risque',
        currentStepName: 'Traitement - Analyse contre-risque' };
      vi.spyOn(demandService, 'getAll').mockReturnValue(of({ ...mockPage, items: [withStep] }));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Traitement - Analyse contre-risque');
    });

    it('should not render a step chip when the demand has no current step', () => {
      vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[title="Étape actuelle du pipeline de traitement"]')).toBeNull();
    });

    it('should render a rejected badge instead of the completed/in-progress badge', () => {
      const rejected = { ...mockDemand, rejected: true, rejectedAt: DATE_2026_08_20T10_00_00Z };
      vi.spyOn(demandService, 'getAll').mockReturnValue(of({ ...mockPage, items: [rejected] }));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const row = compiled.querySelector('tbody tr');
      expect(row?.textContent).toContain('Rejeté');
      expect(row?.textContent).not.toContain('En cours');
    });
  });

  describe('enterprise portfolio filter', () => {
    const mockEnterprise: EnterpriseResponse = {
      id: '7', name: COMPANY_ATLAS_TEXTILE_SARL, sector: 'Textile', registrationNumber: null,
      createdAt: DATE_2026_08_01T10_00_00Z,
    };

    it('should filter by enterpriseId from the query param and show the portfolio banner', () => {
      setup({ enterpriseId: '7' });
      vi.spyOn(enterpriseService, 'getById').mockReturnValue(of(mockEnterprise));
      const getAllSpy = vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      expect(getAllSpy).toHaveBeenCalledWith(1, 20, { enterpriseId: '7' });
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(COMPANY_ATLAS_TEXTILE_SARL);
    });

    it('should not filter when there is no enterpriseId query param', () => {
      const getAllSpy = vi.spyOn(demandService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      expect(getAllSpy).toHaveBeenCalledWith(1, 20, undefined);
    });
  });
});
