import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AcceptInvitationRequest, ClientInvitationPreviewResponse } from '../../models/client-invitation.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class ClientInvitationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/invitations`;

  preview(token: string): Observable<ClientInvitationPreviewResponse> {
    return this.http.get<ClientInvitationPreviewResponse>(`${this.apiUrl}/${token}`).pipe(
      catchError(handleHttpError('ClientInvitationService', 'preview')),
    );
  }

  accept(token: string, request: AcceptInvitationRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${token}/accept`, request).pipe(
      catchError(handleHttpError('ClientInvitationService', 'accept')),
    );
  }
}
