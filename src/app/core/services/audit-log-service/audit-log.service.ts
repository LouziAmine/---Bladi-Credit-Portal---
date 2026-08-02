import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLogEntry } from '../../models/audit-log.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/audit-log`;

  getAll(page = 1, size = 20): Observable<CreditPage<AuditLogEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<AuditLogEntry>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('AuditLogService', 'getAll')),
    );
  }
}
