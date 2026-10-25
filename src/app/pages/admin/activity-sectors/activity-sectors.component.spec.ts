import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivitySectorsComponent as ActivitySectors } from './activity-sectors.component';
import { ActivitySectorService } from '../../../core/services';
import { ActivitySectorResponse } from '../../../core/models/activity-sector.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';

describe('ActivitySectors', () => {
  let fixture: ComponentFixture<ActivitySectors>;
  let component: ActivitySectors;
  let activitySectorService: ActivitySectorService;

  const mockSector: ActivitySectorResponse = {
    id: '1', name: 'Textile', createdAt: DATE_2026_08_01T10_00_00Z,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitySectors],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitySectors);
    component = fixture.componentInstance;
    activitySectorService = TestBed.inject(ActivitySectorService);
  });

  it('should create', () => {
    vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([mockSector]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the sector list on init', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([mockSector]));
      fixture.detectChanges();
      expect(component['activitySectors']()).toEqual([mockSector]);
    });

    it('should handle load error gracefully', () => {
      const error = new HttpErrorResponse({ error: { description: 'Erreur serveur.' }, status: 500 });
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component['loadingList']()).toBe(false);
      expect(component['errorMessage']()).toBe('Erreur serveur.');
    });
  });

  describe('submit', () => {
    it('should not call create when the form is invalid', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([]));
      vi.spyOn(activitySectorService, 'create');
      fixture.detectChanges();
      component['form'].controls.name.setValue('');
      component.submit();
      expect(activitySectorService.create).not.toHaveBeenCalled();
    });

    it('should call create and show success', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([]));
      const createSpy = vi.spyOn(activitySectorService, 'create').mockReturnValue(of(mockSector));
      fixture.detectChanges();
      component['form'].setValue({ name: 'Textile' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ name: 'Textile' });
      expect(component['successMessage']()).toContain('succès');
    });

    it('should set an error message on create failure', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([]));
      const error = new HttpErrorResponse({ error: { description: 'Ce secteur existe déjà.' }, status: 409 });
      vi.spyOn(activitySectorService, 'create').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component['form'].setValue({ name: 'Textile' });

      component.submit();

      expect(component['errorMessage']()).toBe('Ce secteur existe déjà.');
    });
  });

  describe('template', () => {
    it('should render empty state when there are no sectors', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Aucun secteur enregistré');
    });

    it('should render the sector name in the table', () => {
      vi.spyOn(activitySectorService, 'getAll').mockReturnValue(of([mockSector]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Textile');
    });
  });
});
