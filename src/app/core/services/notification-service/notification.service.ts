import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NotificationEntry } from '../../models/notification.model';
import { CreditPage } from '../../models/page.model';
import { handleHttpError } from '../../utils/http-error.handler';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  getMy(page = 1, size = 20): Observable<CreditPage<NotificationEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CreditPage<NotificationEntry>>(this.apiUrl, { params }).pipe(
      catchError(handleHttpError('NotificationService', 'getMy')),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`).pipe(
      catchError(handleHttpError('NotificationService', 'getUnreadCount')),
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {}).pipe(
      catchError(handleHttpError('NotificationService', 'markAsRead')),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {}).pipe(
      catchError(handleHttpError('NotificationService', 'markAllAsRead')),
    );
  }

  openStream(): EventSource {
    return new EventSource(`${this.apiUrl}/stream`, { withCredentials: true });
  }
}
