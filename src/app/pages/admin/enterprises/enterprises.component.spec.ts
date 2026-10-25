import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EnterprisesComponent as Enterprises } from './enterprises.component';
import { EnterpriseService, ActivitySectorService } from '../../../core/services';
import { EnterpriseResponse } from '../../../core/models/enterprise.model';
import { ActivitySectorResponse } from '../../../core/models/activity-sector.model';
import { CreditPage } from '../../../core/models/page.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { COMPANY_ATLAS_TEXTILE_SARL, PERSON_NOUVELLE_ENTREPRISE } from '../../../testing/mocks/mock-contacts';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';

describe('Enterprises', () => {
  let fixture: ComponentFixture<Enterprises>;
  let component: Enterprises;
  let enterpriseService: EnterpriseService;
  let activitySectorService: ActivitySectorService;

  const mockEnterprise: EnterpriseResponse = {
    id: '1', name: COMPANY_ATLAS_TEXTILE_SARL, sector: 'Textile', registrationNumber: null,
    createdAt: DATE_2026_08_01T10_00_00Z,
  };

  const mockPage: CreditPage<EnterpriseResponse> = {
    items: [mockEnterprise], total: 1, lastPage: 2, currentPage: 1, size: 20,
  };

  const mockSectors: ActivitySectorResponse[] = [
    { id: '1', name: 'Textile', createdAt: DATE_2026_08_01T10_00_00Z },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Enterprises],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Enterprises);
    component = fixture.componentInstance;
    enterpriseService = TestBed.inject(EnterpriseService);
    activitySectorService = TestBed.inject(ActivitySectorService);
    vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of(mockSectors));
  });

  it('should create', () => {
    vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the first page on init', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      expect(component['enterprises']()).toEqual([mockEnterprise]);
      expect(component['total']()).toBe(1);
    });

    it('should handle load error gracefully', () => {
      const error = new HttpErrorResponse({ error: { description: 'Erreur serveur.' }, status: 500 });
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component['loadingList']()).toBe(false);
      expect(component['errorMessage']()).toBe('Erreur serveur.');
    });
  });

  describe('pagination', () => {
    it('should go to previous page when not on page 1', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of({ ...mockPage, currentPage: 2 }));
      fixture.detectChanges();
      const spy = vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      component.previousPage();
      expect(spy).toHaveBeenCalledWith(1, 20);
    });

    it('should not go to previous page when already on page 1', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const spy = vi.spyOn(enterpriseService, 'getAll');
      spy.mockClear();
      component.previousPage();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should go to next page when not on last page', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const spy = vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of({ ...mockPage, currentPage: 2 }));
      component.nextPage();
      expect(spy).toHaveBeenCalledWith(2, 20);
    });
  });

  describe('submit', () => {
    it('should not call create when form is invalid', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      vi.spyOn(enterpriseService, 'create');
      fixture.detectChanges();
      component['form'].controls.name.setValue('');
      component.submit();
      expect(enterpriseService.create).not.toHaveBeenCalled();
    });

    it('should call create with trimmed optional sector and show success', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      const createSpy = vi.spyOn(enterpriseService, 'create').mockReturnValue(of(mockEnterprise));
      fixture.detectChanges();
      component['form'].setValue({ name: PERSON_NOUVELLE_ENTREPRISE, registrationNumber: ' RC-45210 ', sector: 'Agroalimentaire' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ name: PERSON_NOUVELLE_ENTREPRISE, sector: 'Agroalimentaire', registrationNumber: 'RC-45210' });
      expect(component['successMessage']()).toContain('succès');
    });

    it('should send undefined sector when left empty', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      const createSpy = vi.spyOn(enterpriseService, 'create').mockReturnValue(of(mockEnterprise));
      fixture.detectChanges();
      component['form'].setValue({ name: PERSON_NOUVELLE_ENTREPRISE, registrationNumber: '', sector: '' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ name: PERSON_NOUVELLE_ENTREPRISE, sector: undefined, registrationNumber: undefined });
    });

    it('should set error message on create failure', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      const error = new HttpErrorResponse({ error: { description: 'Nom déjà utilisé.' }, status: 409 });
      vi.spyOn(enterpriseService, 'create').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component['form'].setValue({ name: 'Doublon', registrationNumber: '', sector: '' });

      component.submit();

      expect(component['errorMessage']()).toBe('Nom déjà utilisé.');
    });
  });

  describe('template', () => {
    it('should render empty state when there are no enterprises', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of({ ...mockPage, items: [], total: 0 }));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Aucune entreprise enregistrée');
    });

    it('should render the enterprise name in the table', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain(COMPANY_ATLAS_TEXTILE_SARL);
    });

    it('should link the portfolio button to the demands page filtered by enterpriseId', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector<HTMLAnchorElement>('a.cb-btn--sm');
      expect(link?.getAttribute('href')).toBe('/admin/demands?enterpriseId=1');
    });

    it('should render the activity sector options in the select', () => {
      vi.spyOn(enterpriseService, 'getAll').mockReturnValue(of(mockPage));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const options = Array.from(compiled.querySelectorAll('#sector option')).map((o) => o.textContent?.trim());
      expect(options).toEqual(['Non précisé', 'Textile']);
    });
  });
});
