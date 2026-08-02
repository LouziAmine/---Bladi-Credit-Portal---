import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreditRateResponse, PatchCreditRateRequest } from '../../models/credit-rate.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class CreditRateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/credit-rates`;

  getAll(page = 1, size = 20): Observable<CreditPage<CreditRateResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<CreditRateResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('CreditRateService', 'getAll')),
    );
  }

  getById(id: number): Observable<CreditRateResponse> {
    return this.http.get<CreditRateResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('CreditRateService', 'getById')),
    );
  }

  patch(id: number, request: PatchCreditRateRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(handleHttpError('CreditRateService', 'patch')),
    );
  }
}
