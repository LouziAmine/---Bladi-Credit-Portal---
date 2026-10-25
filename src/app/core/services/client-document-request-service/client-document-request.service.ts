import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DemandDocumentResponse } from '../../models/document.model';
import { DocumentRequestResponse } from '../../models/document-request.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class ClientDocumentRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/me/demands`;

  list(demandId: string): Observable<DocumentRequestResponse[]> {
    return this.http.get<DocumentRequestResponse[]>(`${this.apiUrl}/${demandId}/document-requests`).pipe(
      catchError(handleHttpError('ClientDocumentRequestService', 'list')),
    );
  }

  uploadForRequest(demandId: string, requestId: string, file: File): Observable<DemandDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<DemandDocumentResponse>(`${this.apiUrl}/${demandId}/document-requests/${requestId}/documents`, formData)
      .pipe(catchError(handleHttpError('ClientDocumentRequestService', 'uploadForRequest')));
  }

  downloadFulfilledDocument(demandId: string, requestId: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${demandId}/document-requests/${requestId}/documents/download`, { responseType: 'blob' })
      .pipe(catchError(handleHttpError('ClientDocumentRequestService', 'downloadFulfilledDocument')));
  }
}
