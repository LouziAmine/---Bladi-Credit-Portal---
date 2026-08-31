import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InvestmentCreditRequest, InvestmentCreditResponse } from '../../models/investment-credit.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class InvestmentCreditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/investment-credit`;

  simulate(request: InvestmentCreditRequest): Observable<InvestmentCreditResponse> {
    return this.http.post<InvestmentCreditResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('InvestmentCreditService', 'simulate')),
    );
  }
}
