import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ClaimEnterpriseLinkRequest,
  ClientDemandSummaryResponse,
  ClientPortfolioEnterpriseResponse,
  EnterpriseUserLinkResponse,
} from '../../models/enterprise-user-link.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class ClientPortfolioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/me`;

  claimEnterprise(request: ClaimEnterpriseLinkRequest): Observable<EnterpriseUserLinkResponse> {
    return this.http.post<EnterpriseUserLinkResponse>(`${this.apiUrl}/enterprise-links`, request).pipe(
      catchError(handleHttpError('ClientPortfolioService', 'claimEnterprise')),
    );
  }

  getMyEnterpriseLinks(): Observable<EnterpriseUserLinkResponse[]> {
    return this.http.get<EnterpriseUserLinkResponse[]>(`${this.apiUrl}/enterprise-links`).pipe(
      catchError(handleHttpError('ClientPortfolioService', 'getMyEnterpriseLinks')),
    );
  }

  getMyPortfolio(): Observable<ClientPortfolioEnterpriseResponse[]> {
    return this.http.get<ClientPortfolioEnterpriseResponse[]>(`${this.apiUrl}/portfolio`).pipe(
      catchError(handleHttpError('ClientPortfolioService', 'getMyPortfolio')),
    );
  }

  getMyMortgageDemands(): Observable<ClientDemandSummaryResponse[]> {
    return this.http.get<ClientDemandSummaryResponse[]>(`${this.apiUrl}/mortgage-demands`).pipe(
      catchError(handleHttpError('ClientPortfolioService', 'getMyMortgageDemands')),
    );
  }

  getPortfolioDemands(enterpriseId: string, page = 1, size = 20): Observable<CreditPage<ClientDemandSummaryResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<CreditPage<ClientDemandSummaryResponse>>(`${this.apiUrl}/portfolio/${enterpriseId}/demands`, { params })
      .pipe(catchError(handleHttpError('ClientPortfolioService', 'getPortfolioDemands')));
  }
}
