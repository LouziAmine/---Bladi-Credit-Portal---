import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BamScenario, BamVerificationRequest, BamVerificationResponse } from '../../models/bam-verification.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class BamVerificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/mock/verification-bam`;

  verify(request: BamVerificationRequest, forcedScenario?: BamScenario | null): Observable<BamVerificationResponse> {
    const params = forcedScenario ? new HttpParams().set('scenario', forcedScenario) : undefined;
    return this.http.post<BamVerificationResponse>(this.apiUrl, request, { params }).pipe(
      catchError(handleHttpError('BamVerificationService', 'verify')),
    );
  }
}
