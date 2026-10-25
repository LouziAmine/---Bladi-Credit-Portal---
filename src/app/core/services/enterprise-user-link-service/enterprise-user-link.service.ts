import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EnterpriseUserLinkResponse,
  InviteEnterpriseLinkRequest,
  RejectEnterpriseLinkRequest,
} from '../../models/enterprise-user-link.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class EnterpriseUserLinkService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  inviteClient(enterpriseId: string, request: InviteEnterpriseLinkRequest): Observable<EnterpriseUserLinkResponse> {
    return this.http
      .post<EnterpriseUserLinkResponse>(`${this.apiUrl}/enterprises/${enterpriseId}/user-links`, request)
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'inviteClient')));
  }

  getLinksForEnterprise(enterpriseId: string, page = 1, size = 20): Observable<CreditPage<EnterpriseUserLinkResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<CreditPage<EnterpriseUserLinkResponse>>(`${this.apiUrl}/enterprises/${enterpriseId}/user-links`, { params })
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'getLinksForEnterprise')));
  }

  getPendingLinks(page = 1, size = 20): Observable<CreditPage<EnterpriseUserLinkResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<CreditPage<EnterpriseUserLinkResponse>>(`${this.apiUrl}/enterprise-user-links`, { params })
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'getPendingLinks')));
  }

  approve(linkId: string): Observable<EnterpriseUserLinkResponse> {
    return this.http
      .patch<EnterpriseUserLinkResponse>(`${this.apiUrl}/enterprise-user-links/${linkId}/approve`, null)
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'approve')));
  }

  reject(linkId: string, request: RejectEnterpriseLinkRequest): Observable<EnterpriseUserLinkResponse> {
    return this.http
      .patch<EnterpriseUserLinkResponse>(`${this.apiUrl}/enterprise-user-links/${linkId}/reject`, request)
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'reject')));
  }

  revoke(linkId: string): Observable<EnterpriseUserLinkResponse> {
    return this.http
      .patch<EnterpriseUserLinkResponse>(`${this.apiUrl}/enterprise-user-links/${linkId}/revoke`, null)
      .pipe(catchError(handleHttpError('EnterpriseUserLinkService', 'revoke')));
  }
}
