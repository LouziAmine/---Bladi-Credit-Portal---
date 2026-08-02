import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export function handleHttpError(service: string, operation: string, isProduction = environment.production) {
  return (error: HttpErrorResponse): Observable<never> => {
    if (!isProduction) {
      console.error(`[${service}] ${operation} failed:`, error.message);
    }
    return throwError(() => error);
  };
}