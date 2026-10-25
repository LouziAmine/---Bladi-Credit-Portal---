import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorMessageService {
  private readonly translate = inject(TranslateService);

  describe(err: HttpErrorResponse, fallbackKey: string): string {
    return (err.error as ApiError | null)?.description ?? this.translate.instant(fallbackKey);
  }
}
