import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DemandImportReport, DemandImportStartResponse } from '../../models/demand-import.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class DemandImportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/demands/import`;

  startImport(file: File): Observable<DemandImportStartResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DemandImportStartResponse>(this.apiUrl, formData).pipe(
      catchError(handleHttpError('DemandImportService', 'startImport')),
    );
  }

  getReport(jobExecutionId: number): Observable<DemandImportReport> {
    return this.http.get<DemandImportReport>(`${this.apiUrl}/${jobExecutionId}`).pipe(
      catchError(handleHttpError('DemandImportService', 'getReport')),
    );
  }
}
