import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MourabahaParametersResponse,
  PatchMourabahaParametersRequest,
} from '../../models/mourabaha-parameters.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class MourabahaParametersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/mourabaha-parameters`;

  getAll(page = 1, size = 20): Observable<CreditPage<MourabahaParametersResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<MourabahaParametersResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('MourabahaParametersService', 'getAll')),
    );
  }

  getById(id: number): Observable<MourabahaParametersResponse> {
    return this.http.get<MourabahaParametersResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('MourabahaParametersService', 'getById')),
    );
  }

  patch(id: number, request: PatchMourabahaParametersRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(handleHttpError('MourabahaParametersService', 'patch')),
    );
  }
}
