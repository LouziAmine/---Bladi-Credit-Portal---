import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BamParametersResponse, PatchBamParametersRequest } from '../../models/bam-parameters.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class BamParametersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bam-parameters`;

  getAll(page = 1, size = 20): Observable<CreditPage<BamParametersResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<BamParametersResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('BamParametersService', 'getAll')),
    );
  }

  getById(id: number): Observable<BamParametersResponse> {
    return this.http.get<BamParametersResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('BamParametersService', 'getById')),
    );
  }

  patch(id: number, request: PatchBamParametersRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, request).pipe(
      catchError(handleHttpError('BamParametersService', 'patch')),
    );
  }
}
