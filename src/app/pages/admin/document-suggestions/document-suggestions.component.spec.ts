import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentSuggestionsComponent } from './document-suggestions.component';
import { DocumentSuggestionService } from '../../../core/services/document-suggestion-service/document-suggestion.service';
import { DocumentSuggestionResponse } from '../../../core/models/document-suggestion.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { CODE_PME, CODE_SALA } from '../../../testing/mocks/mock-codes';
import { DATE_2026_08_01T10_00_00Z } from '../../../testing/mocks/mock-dates';

describe('DocumentSuggestions', () => {
  let fixture: ComponentFixture<DocumentSuggestionsComponent>;
  let component: DocumentSuggestionsComponent;
  let documentSuggestionService: DocumentSuggestionService;

  const mockSuggestion: DocumentSuggestionResponse = {
    id: '1', enterpriseType: CODE_PME, cspCode: null, label: 'Liasse fiscale certifiée', createdAt: DATE_2026_08_01T10_00_00Z,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSuggestionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentSuggestionsComponent);
    component = fixture.componentInstance;
    documentSuggestionService = TestBed.inject(DocumentSuggestionService);
  });

  it('should create', () => {
    vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([mockSuggestion]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load the suggestion list on init', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([mockSuggestion]));
      fixture.detectChanges();
      expect(component['suggestions']()).toEqual([mockSuggestion]);
    });

    it('should handle load error gracefully', () => {
      const error = new HttpErrorResponse({ error: { description: 'Erreur serveur.' }, status: 500 });
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      expect(component['loadingList']()).toBe(false);
      expect(component['errorMessage']()).toBe('Erreur serveur.');
    });
  });

  describe('submit', () => {
    it('should not call create when the form is invalid', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      vi.spyOn(documentSuggestionService, 'create');
      fixture.detectChanges();
      component['form'].controls.label.setValue('');
      component.submit();
      expect(documentSuggestionService.create).not.toHaveBeenCalled();
    });

    it('should send null enterpriseType when the "common" option is kept', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      const createSpy = vi.spyOn(documentSuggestionService, 'create').mockReturnValue(of(mockSuggestion));
      fixture.detectChanges();
      component['form'].setValue({ scope: '', label: 'CIN du dirigeant' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ enterpriseType: null, label: 'CIN du dirigeant' });
      expect(component['successMessage']()).toContain('succès');
    });

    it('should send the selected enterpriseType', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      const createSpy = vi.spyOn(documentSuggestionService, 'create').mockReturnValue(of(mockSuggestion));
      fixture.detectChanges();
      component['form'].setValue({ scope: 'ENTERPRISE:PME', label: 'Liasse fiscale certifiée' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ enterpriseType: CODE_PME, label: 'Liasse fiscale certifiée' });
    });

    it('should send the selected cspCode for a mortgage-scoped suggestion', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      const createSpy = vi.spyOn(documentSuggestionService, 'create').mockReturnValue(of(mockSuggestion));
      fixture.detectChanges();
      component['form'].setValue({ scope: 'CSP:SALA', label: 'Bulletins de salaire' });

      component.submit();

      expect(createSpy).toHaveBeenCalledWith({ enterpriseType: null, cspCode: CODE_SALA, label: 'Bulletins de salaire' });
    });

    it('should set an error message on create failure', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      const error = new HttpErrorResponse({ error: { description: 'Doublon.' }, status: 409 });
      vi.spyOn(documentSuggestionService, 'create').mockReturnValue(throwError(() => error));
      fixture.detectChanges();
      component['form'].setValue({ scope: '', label: 'CIN du dirigeant' });

      component.submit();

      expect(component['errorMessage']()).toBe('Doublon.');
    });
  });

  describe('delete', () => {
    it('should call delete and reload the list', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([mockSuggestion]));
      const deleteSpy = vi.spyOn(documentSuggestionService, 'delete').mockReturnValue(of(undefined));
      fixture.detectChanges();

      component.delete('1');

      expect(deleteSpy).toHaveBeenCalledWith('1');
      expect(component['deletingId']()).toBeNull();
    });

    it('should set an error message on delete failure', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([mockSuggestion]));
      const error = new HttpErrorResponse({ error: { description: 'Introuvable.' }, status: 404 });
      vi.spyOn(documentSuggestionService, 'delete').mockReturnValue(throwError(() => error));
      fixture.detectChanges();

      component.delete('1');

      expect(component['errorMessage']()).toBe('Introuvable.');
    });
  });

  describe('template', () => {
    it('should render empty state when there are no suggestions', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Aucune suggestion de document enregistrée');
    });

    it('should render the suggestion label in the table', () => {
      vi.spyOn(documentSuggestionService, 'getAll').mockReturnValue(of([mockSuggestion]));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Liasse fiscale certifiée');
    });
  });
});
