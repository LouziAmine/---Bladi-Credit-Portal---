import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GradeResponse, TeamResponse } from '../../models/reference-data.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getGrades(): Observable<GradeResponse[]> {
    return this.http.get<GradeResponse[]>(`${this.apiUrl}/grades`).pipe(
      catchError(handleHttpError('ReferenceDataService', 'getGrades')),
    );
  }

  getTeams(): Observable<TeamResponse[]> {
    return this.http.get<TeamResponse[]>(`${this.apiUrl}/teams`).pipe(
      catchError(handleHttpError('ReferenceDataService', 'getTeams')),
    );
  }
}
