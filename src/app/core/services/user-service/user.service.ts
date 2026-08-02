import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateUserRequest, UpdateUserRoleRequest, UserResponse } from '../../models/user.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getAll(page = 1, size = 20): Observable<CreditPage<UserResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<UserResponse>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('UserService', 'getAll')),
    );
  }

  createUser(request: CreateUserRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request).pipe(
      catchError(handleHttpError('UserService', 'createUser')),
    );
  }

  updateUserRole(id: number, request: UpdateUserRoleRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/role`, request).pipe(
      catchError(handleHttpError('UserService', 'updateUserRole')),
    );
  }
}
