import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SimulationRequest, SimulationResponse } from '../../models/simulation.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/simulation`;

  simulate(request: SimulationRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(this.apiUrl, request).pipe(
      catchError(handleHttpError('SimulationService', 'simulate')),
    );
  }
}