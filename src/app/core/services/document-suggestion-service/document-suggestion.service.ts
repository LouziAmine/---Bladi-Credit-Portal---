import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateDocumentSuggestionRequest, DocumentSuggestionResponse } from '../../models/document-suggestion.model';
import { EnterpriseType } from '../../models/investment-credit.model';
import { CspCode } from '../../models/mortgage-credit.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class DocumentSuggestionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/document-suggestions`;

  getAll(enterpriseType?: EnterpriseType | null, cspCode?: CspCode | null): Observable<DocumentSuggestionResponse[]> {
    let params = new HttpParams();
    if (cspCode) {
      params = params.set('cspCode', cspCode);
    } else if (enterpriseType) {
      params = params.set('enterpriseType', enterpriseType);
    }
    return this.http.get<DocumentSuggestionResponse[]>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('DocumentSuggestionService', 'getAll')),
    );
  }

  create(request: CreateDocumentSuggestionRequest): Observable<DocumentSuggestionResponse> {
    return this.http.post<DocumentSuggestionResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('DocumentSuggestionService', 'create')),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('DocumentSuggestionService', 'delete')),
    );
  }
}
