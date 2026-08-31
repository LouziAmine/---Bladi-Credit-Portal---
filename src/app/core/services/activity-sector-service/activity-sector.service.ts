import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActivitySectorResponse, CreateActivitySectorRequest } from '../../models/activity-sector.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class ActivitySectorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activity-sectors`;

  getAll(): Observable<ActivitySectorResponse[]> {
    return this.http.get<ActivitySectorResponse[]>(this.apiUrl).pipe(
      catchError(handleHttpError('ActivitySectorService', 'getAll')),
    );
  }

  create(request: CreateActivitySectorRequest): Observable<ActivitySectorResponse> {
    return this.http.post<ActivitySectorResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('ActivitySectorService', 'create')),
    );
  }
}
