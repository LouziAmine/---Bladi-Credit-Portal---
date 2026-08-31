import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MortgageCreditRequest, MortgageCreditResponse } from '../../models/mortgage-credit.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class MortgageCreditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/mortgage-credit`;

  simulate(request: MortgageCreditRequest): Observable<MortgageCreditResponse> {
    return this.http.post<MortgageCreditResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('MortgageCreditService', 'simulate')),
    );
  }
}