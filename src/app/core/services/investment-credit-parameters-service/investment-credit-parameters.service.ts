import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnterpriseType } from '../../models/investment-credit.model';
import {
  InvestmentCreditParametersResponse,
  PatchInvestmentCreditParametersRequest,
} from '../../models/investment-credit-parameters.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class InvestmentCreditParametersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/investment-credit-parameters`;

  getById(id: string): Observable<InvestmentCreditParametersResponse> {
    return this.http.get<InvestmentCreditParametersResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('InvestmentCreditParametersService', 'getById')),
    );
  }

  getByType(enterpriseType: EnterpriseType): Observable<InvestmentCreditParametersResponse> {
    return this.http.get<InvestmentCreditParametersResponse>(`${this.apiUrl}/type/${enterpriseType}`).pipe(
      catchError(handleHttpError('InvestmentCreditParametersService', 'getByType')),
    );
  }

  patch(id: string, request: PatchInvestmentCreditParametersRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(handleHttpError('InvestmentCreditParametersService', 'patch')),
    );
  }
}
