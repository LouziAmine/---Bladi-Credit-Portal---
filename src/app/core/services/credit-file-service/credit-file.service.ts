import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreditFileResponse, InstallmentResponse } from '../../models/credit-file.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class CreditFileService {
  private readonly http = inject(HttpClient);
  private readonly clientApiUrl = `${environment.apiUrl}/me/demands`;
  private readonly managerApiUrl = `${environment.apiUrl}/demands`;

  getByDemandId(demandId: string): Observable<CreditFileResponse> {
    return this.http.get<CreditFileResponse>(`${this.clientApiUrl}/${demandId}/credit-file`).pipe(
      catchError(handleHttpError('CreditFileService', 'getByDemandId')),
    );
  }

  payInstallment(demandId: string, installmentId: string, sourceRib: string): Observable<InstallmentResponse> {
    return this.http
      .post<InstallmentResponse>(
        `${this.clientApiUrl}/${demandId}/credit-file/installments/${installmentId}/payments`, { sourceRib })
      .pipe(catchError(handleHttpError('CreditFileService', 'payInstallment')));
  }

  getByDemandIdForManager(demandId: string): Observable<CreditFileResponse> {
    return this.http.get<CreditFileResponse>(`${this.managerApiUrl}/${demandId}/credit-file`).pipe(
      catchError(handleHttpError('CreditFileService', 'getByDemandIdForManager')),
    );
  }

  validatePayment(demandId: string, installmentId: string): Observable<InstallmentResponse> {
    return this.http
      .post<InstallmentResponse>(
        `${this.managerApiUrl}/${demandId}/credit-file/installments/${installmentId}/payments/validate`, {})
      .pipe(catchError(handleHttpError('CreditFileService', 'validatePayment')));
  }

  rejectPayment(demandId: string, installmentId: string, reason: string): Observable<InstallmentResponse> {
    return this.http
      .post<InstallmentResponse>(
        `${this.managerApiUrl}/${demandId}/credit-file/installments/${installmentId}/payments/reject`, { reason })
      .pipe(catchError(handleHttpError('CreditFileService', 'rejectPayment')));
  }
}
