import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EarlyRepaymentQuoteResponse,
  EarlyRepaymentRequest,
  EarlyRepaymentResponse,
} from '../../models/early-repayment.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class EarlyRepaymentService {
  private readonly http = inject(HttpClient);
  private readonly clientApiUrl = `${environment.apiUrl}/me/demands`;
  private readonly managerApiUrl = `${environment.apiUrl}/demands`;

  quote(demandId: string, amount: number | null, asClient: boolean): Observable<EarlyRepaymentQuoteResponse> {
    const base = asClient ? this.clientApiUrl : this.managerApiUrl;
    const params = amount != null ? new HttpParams().set('amount', amount) : undefined;
    return this.http
      .get<EarlyRepaymentQuoteResponse>(`${base}/${demandId}/credit-file/early-repayments/quote`, { params })
      .pipe(catchError(handleHttpError('EarlyRepaymentService', 'quote')));
  }

  repay(demandId: string, request: EarlyRepaymentRequest): Observable<EarlyRepaymentResponse> {
    return this.http
      .post<EarlyRepaymentResponse>(`${this.managerApiUrl}/${demandId}/credit-file/early-repayments`, request)
      .pipe(catchError(handleHttpError('EarlyRepaymentService', 'repay')));
  }

  history(demandId: string): Observable<EarlyRepaymentResponse[]> {
    return this.http
      .get<EarlyRepaymentResponse[]>(`${this.managerApiUrl}/${demandId}/credit-file/early-repayments`)
      .pipe(catchError(handleHttpError('EarlyRepaymentService', 'history')));
  }
}
