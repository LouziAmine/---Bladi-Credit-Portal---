import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ReferenceDataService } from './reference-data.service';
import { GradeResponse, TeamResponse } from '../../models/reference-data.model';
import { CODE_ANALYSTE, CODE_PAE } from '../../../testing/mocks/mock-codes';

describe('ReferenceDataService', () => {
  let service: ReferenceDataService;
  let httpMock: HttpTestingController;

  const mockGrades: GradeResponse[] = [
    { id: '3', code: CODE_ANALYSTE, name: 'Analyste' },
  ];

  const mockTeams: TeamResponse[] = [
    { id: '5', code: CODE_PAE, name: 'PAE (Pôle Analyse et Engagements)' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReferenceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGrades', () => {
    it('should GET the list of grades', () => {
      service.getGrades().subscribe((response) => {
        expect(response).toEqual(mockGrades);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/grades');
      expect(req.request.method).toBe('GET');
      req.flush(mockGrades);
    });
  });

  describe('getTeams', () => {
    it('should GET the list of teams', () => {
      service.getTeams().subscribe((response) => {
        expect(response).toEqual(mockTeams);
      });

      const req = httpMock.expectOne('http://localhost:8080/api/v1/teams');
      expect(req.request.method).toBe('GET');
      req.flush(mockTeams);
    });
  });
});
