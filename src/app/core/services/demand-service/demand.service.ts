import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreditPage } from '../../models/page.model';
import {
  AddDemandCommentRequest,
  AdvanceDemandRequest,
  AssignDemandRequest,
  ClassifyDemandRequest,
  DemandAmortizationResponse,
  DemandAssignmentHistoryEntryResponse,
  DemandCommentResponse,
  DemandHistoryEntryResponse,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandSearchFilters,
  DemandStepResponse,
  EligibleAssigneeDirection,
} from '../../models/demand.model';
import { UserResponse } from '../../models/user.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class DemandService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/demands`;

  getAll(page = 1, size = 20, filters?: DemandSearchFilters): Observable<CreditPage<DemandResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters?.enterpriseId != null) {
      params = params.set('enterpriseId', filters.enterpriseId);
    }
    if (filters?.companyName) {
      params = params.set('companyName', filters.companyName);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.minAmount != null) {
      params = params.set('minAmount', filters.minAmount);
    }
    if (filters?.maxAmount != null) {
      params = params.set('maxAmount', filters.maxAmount);
    }
    return this.http.get<CreditPage<DemandResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('DemandService', 'getAll')),
    );
  }

  getById(id: string): Observable<DemandResponse> {
    return this.http.get<DemandResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(handleHttpError('DemandService', 'getById')),
    );
  }

  getCurrentStep(id: string): Observable<DemandStepResponse> {
    return this.http.get<DemandStepResponse>(`${this.apiUrl}/${id}/current-step`).pipe(
      catchError(handleHttpError('DemandService', 'getCurrentStep')),
    );
  }

  getHistory(id: string): Observable<DemandHistoryEntryResponse[]> {
    return this.http.get<DemandHistoryEntryResponse[]>(`${this.apiUrl}/${id}/history`).pipe(
      catchError(handleHttpError('DemandService', 'getHistory')),
    );
  }

  getPipeline(id: string): Observable<DemandPipelineStepResponse[]> {
    return this.http.get<DemandPipelineStepResponse[]>(`${this.apiUrl}/${id}/pipeline`).pipe(
      catchError(handleHttpError('DemandService', 'getPipeline')),
    );
  }

  getAmortizationSchedule(
    id: string,
    overrides?: { rate?: number; amount?: number; duration?: number },
  ): Observable<DemandAmortizationResponse> {
    let params = new HttpParams();
    if (overrides?.rate != null) {
      params = params.set('rate', overrides.rate);
    }
    if (overrides?.amount != null) {
      params = params.set('amount', overrides.amount);
    }
    if (overrides?.duration != null) {
      params = params.set('duration', overrides.duration);
    }
    return this.http.get<DemandAmortizationResponse>(`${this.apiUrl}/${id}/amortization`, { params }).pipe(
      catchError(handleHttpError('DemandService', 'getAmortizationSchedule')),
    );
  }

  advance(id: string, request: AdvanceDemandRequest): Observable<DemandResponse> {
    return this.http.post<DemandResponse>(`${this.apiUrl}/${id}/advance`, request).pipe(
      catchError(handleHttpError('DemandService', 'advance')),
    );
  }

  classify(id: string, request: ClassifyDemandRequest): Observable<DemandResponse> {
    return this.http.post<DemandResponse>(`${this.apiUrl}/${id}/classify`, request).pipe(
      catchError(handleHttpError('DemandService', 'classify')),
    );
  }

  assign(id: string, request: AssignDemandRequest): Observable<DemandStepResponse> {
    return this.http.post<DemandStepResponse>(`${this.apiUrl}/${id}/assign`, request).pipe(
      catchError(handleHttpError('DemandService', 'assign')),
    );
  }

  getAssignmentHistory(id: string): Observable<DemandAssignmentHistoryEntryResponse[]> {
    return this.http.get<DemandAssignmentHistoryEntryResponse[]>(`${this.apiUrl}/${id}/assignment-history`).pipe(
      catchError(handleHttpError('DemandService', 'getAssignmentHistory')),
    );
  }

  getEligibleAssignees(id: string, direction: EligibleAssigneeDirection = 'CURRENT'): Observable<UserResponse[]> {
    const params = new HttpParams().set('direction', direction);
    return this.http.get<UserResponse[]>(`${this.apiUrl}/${id}/eligible-assignees`, { params }).pipe(
      catchError(handleHttpError('DemandService', 'getEligibleAssignees')),
    );
  }

  getComments(id: string): Observable<DemandCommentResponse[]> {
    return this.http.get<DemandCommentResponse[]>(`${this.apiUrl}/${id}/comments`).pipe(
      catchError(handleHttpError('DemandService', 'getComments')),
    );
  }

  addComment(id: string, request: AddDemandCommentRequest): Observable<DemandCommentResponse> {
    return this.http.post<DemandCommentResponse>(`${this.apiUrl}/${id}/comments`, request).pipe(
      catchError(handleHttpError('DemandService', 'addComment')),
    );
  }
}
