import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DemandImportComponent } from './demand-import.component';
import { DemandImportService } from '../../../../core/services/demand-import-service/demand-import.service';
import { DemandImportReport, DemandImportStartResponse } from '../../../../core/models/demand-import.model';
import { provideTranslateTesting } from '../../../../testing/translate-testing.providers';
import { CODE_COMPLETED, CODE_STARTED } from '../../../../testing/mocks/mock-codes';
import { DATE_2026_09_09T10_00_00, DATE_2026_09_09T10_00_05 } from '../../../../testing/mocks/mock-dates';
import { FILE_DEMANDS_CSV, FILE_DEMANDS_XLSX } from '../../../../testing/mocks/mock-files';

describe('DemandImportComponent', () => {
  let fixture: ComponentFixture<DemandImportComponent>;
  let component: DemandImportComponent;
  let demandImportService: DemandImportService;

  const startResponse: DemandImportStartResponse = { jobExecutionId: 42 };

  const runningReport: DemandImportReport = {
    jobExecutionId: 42, status: CODE_STARTED, readCount: 0, writeCount: 0, skipCount: 0,
    startTime: DATE_2026_09_09T10_00_00, endTime: null, rowErrors: [],
  };

  const completedReport: DemandImportReport = {
    jobExecutionId: 42, status: CODE_COMPLETED, readCount: 3, writeCount: 2, skipCount: 1,
    startTime: DATE_2026_09_09T10_00_00, endTime: DATE_2026_09_09T10_00_05,
    rowErrors: [{ rowNumber: 4, companyName: null, errorMessage: 'amount est obligatoire' }],
  };

  function setup(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DemandImportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemandImportComponent);
    component = fixture.componentInstance;
    demandImportService = TestBed.inject(DemandImportService);
  }

  function fileOf(name: string, sizeBytes: number): File {
    return new File([new Uint8Array(sizeBytes)], name, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  function selectFile(file: File | null): void {
    const input = document.createElement('input');
    input.type = 'file';
    if (file) {
      Object.defineProperty(input, 'files', { value: [file] });
    }
    component.onFileSelected({ target: input } as unknown as Event);
  }

  beforeEach(() => {
    setup();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onFileSelected', () => {
    it('should reject an empty file', () => {
      selectFile(fileOf(FILE_DEMANDS_XLSX, 0));
      expect(component['selectedFile']()).toBeNull();
      expect(component['selectedFileError']()).toBe('Le fichier sélectionné est vide.');
    });

    it('should reject a file over the size limit', () => {
      selectFile(fileOf(FILE_DEMANDS_XLSX, 16 * 1024 * 1024));
      expect(component['selectedFile']()).toBeNull();
      expect(component['selectedFileError']()).toContain('taille maximale');
    });

    it('should reject a non-.xlsx file', () => {
      selectFile(fileOf(FILE_DEMANDS_CSV, 1024));
      expect(component['selectedFile']()).toBeNull();
      expect(component['selectedFileError']()).toBe('Seuls les fichiers .xlsx sont acceptés.');
    });

    it('should accept a valid .xlsx file', () => {
      const file = fileOf(FILE_DEMANDS_XLSX, 1024);
      selectFile(file);
      expect(component['selectedFile']()).toBe(file);
      expect(component['selectedFileError']()).toBeNull();
    });
  });

  describe('startImport', () => {
    it('should do nothing when no file is selected', () => {
      const spy = vi.spyOn(demandImportService, 'startImport');
      component.startImport();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should start the import and begin polling on success', () => {
      vi.useFakeTimers();
      selectFile(fileOf(FILE_DEMANDS_XLSX, 1024));
      vi.spyOn(demandImportService, 'startImport').mockReturnValue(of(startResponse));
      const getReportSpy = vi.spyOn(demandImportService, 'getReport').mockReturnValue(of(runningReport));

      component.startImport();
      vi.advanceTimersByTime(0);

      expect(component['uploading']()).toBe(false);
      expect(component['selectedFile']()).toBeNull();
      expect(getReportSpy).toHaveBeenCalledWith(42);
      expect(component['report']()).toEqual(runningReport);
      expect(component['polling']()).toBe(true);

      vi.useRealTimers();
    });

    it('should stop polling once the job reaches a terminal status', () => {
      vi.useFakeTimers();
      selectFile(fileOf(FILE_DEMANDS_XLSX, 1024));
      vi.spyOn(demandImportService, 'startImport').mockReturnValue(of(startResponse));
      vi.spyOn(demandImportService, 'getReport').mockReturnValue(of(completedReport));

      component.startImport();
      vi.advanceTimersByTime(0);

      expect(component['report']()).toEqual(completedReport);
      expect(component['polling']()).toBe(false);
      expect(component.isTerminal(completedReport.status)).toBe(true);

      vi.useRealTimers();
    });

    it('should surface the API error message when startImport fails', () => {
      selectFile(fileOf(FILE_DEMANDS_XLSX, 1024));
      const error = new HttpErrorResponse({ error: { description: 'Un import est déjà en cours.' }, status: 409 });
      vi.spyOn(demandImportService, 'startImport').mockReturnValue(throwError(() => error));

      component.startImport();

      expect(component['uploading']()).toBe(false);
      expect(component['uploadErrorMessage']()).toBe('Un import est déjà en cours.');
    });
  });

  describe('drag and drop', () => {
    function dragEvent(files: File[] | null): DragEvent {
      return {
        preventDefault: vi.fn(),
        dataTransfer: files ? { files } : null,
      } as unknown as DragEvent;
    }

    it('should turn on the dragover state on dragover', () => {
      component.onDragOver(dragEvent(null));
      expect(component['dragOver']()).toBe(true);
    });

    it('should not turn on the dragover state while uploading', () => {
      component['uploading'].set(true);
      component.onDragOver(dragEvent(null));
      expect(component['dragOver']()).toBe(false);
    });

    it('should turn off the dragover state on dragleave', () => {
      component['dragOver'].set(true);
      component.onDragLeave(dragEvent(null));
      expect(component['dragOver']()).toBe(false);
    });

    it('should accept a dropped file and clear the dragover state', () => {
      const file = fileOf(FILE_DEMANDS_XLSX, 1024);
      component['dragOver'].set(true);
      component.onDrop(dragEvent([file]));
      expect(component['dragOver']()).toBe(false);
      expect(component['selectedFile']()).toBe(file);
    });

    it('should validate a dropped file the same way as a picked file', () => {
      component.onDrop(dragEvent([fileOf(FILE_DEMANDS_CSV, 1024)]));
      expect(component['selectedFile']()).toBeNull();
      expect(component['selectedFileError']()).toBe('Seuls les fichiers .xlsx sont acceptés.');
    });
  });

  describe('removeFile', () => {
    it('should clear the selected file and any error', () => {
      selectFile(fileOf(FILE_DEMANDS_XLSX, 1024));
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      component.removeFile(event);

      expect(component['selectedFile']()).toBeNull();
      expect(component['selectedFileError']()).toBeNull();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('startOver', () => {
    it('should clear the report and error messages', () => {
      component['report'].set(completedReport);
      component['pollErrorMessage'].set('oops');
      component['uploadErrorMessage'].set('oops');

      component.startOver();

      expect(component['report']()).toBeNull();
      expect(component['pollErrorMessage']()).toBeNull();
      expect(component['uploadErrorMessage']()).toBeNull();
    });
  });
});
