import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateDocumentRequestRequest, DocumentRequestResponse } from '../../models/document-request.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class DocumentRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/demands`;

  list(demandId: string): Observable<DocumentRequestResponse[]> {
    return this.http.get<DocumentRequestResponse[]>(`${this.apiUrl}/${demandId}/document-requests`).pipe(
      catchError(handleHttpError('DocumentRequestService', 'list')),
    );
  }

  create(demandId: string, request: CreateDocumentRequestRequest): Observable<DocumentRequestResponse> {
    return this.http.post<DocumentRequestResponse>(`${this.apiUrl}/${demandId}/document-requests`, request).pipe(
      catchError(handleHttpError('DocumentRequestService', 'create')),
    );
  }
}
