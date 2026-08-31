import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DemandDocumentResponse } from '../../models/document.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/demands`;

  list(demandId: string): Observable<DemandDocumentResponse[]> {
    return this.http.get<DemandDocumentResponse[]>(`${this.apiUrl}/${demandId}/documents`).pipe(
      catchError(handleHttpError('DocumentService', 'list')),
    );
  }

  upload(demandId: string, file: File, documentType?: string): Observable<DemandDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('documentType', documentType);
    }
    return this.http.post<DemandDocumentResponse>(`${this.apiUrl}/${demandId}/documents`, formData).pipe(
      catchError(handleHttpError('DocumentService', 'upload')),
    );
  }

  download(demandId: string, documentId: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${demandId}/documents/${documentId}/download`, { responseType: 'blob' })
      .pipe(catchError(handleHttpError('DocumentService', 'download')));
  }
}
