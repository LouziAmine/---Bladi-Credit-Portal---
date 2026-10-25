import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateEnterpriseRequest, EnterpriseMatchResponse, EnterpriseResponse } from '../../models/enterprise.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/enterprises`;

  getAll(page = 1, size = 20): Observable<CreditPage<EnterpriseResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<EnterpriseResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('EnterpriseService', 'getAll')),
    );
  }

  getById(id: string): Observable<EnterpriseResponse> {
    return this.http.get<EnterpriseResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('EnterpriseService', 'getById')),
    );
  }

  create(request: CreateEnterpriseRequest): Observable<EnterpriseResponse> {
    return this.http.post<EnterpriseResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('EnterpriseService', 'create')),
    );
  }

  matchByName(name: string): Observable<EnterpriseMatchResponse> {
    const params = new HttpParams().set('name', name);
    return this.http.get<EnterpriseMatchResponse>(`${this.apiUrl}/match`, { params }).pipe(
      catchError(handleHttpError('EnterpriseService', 'matchByName')),
    );
  }
}
