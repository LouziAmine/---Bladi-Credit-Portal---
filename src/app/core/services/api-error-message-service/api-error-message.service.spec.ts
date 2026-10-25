import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorMessageService } from './api-error-message.service';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';

describe('ApiErrorMessageService', () => {
  let service: ApiErrorMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateTesting()] });
    service = TestBed.inject(ApiErrorMessageService);
  });

  it('should return the backend description when present', () => {
    const err = new HttpErrorResponse({ error: { description: 'Montant invalide.' }, status: 400 });
    expect(service.describe(err, 'adminCommon.updateErrorFallback')).toBe('Montant invalide.');
  });

  it('should fall back to the translated key when the body has no description', () => {
    const err = new HttpErrorResponse({ error: null, status: 500 });
    const message = service.describe(err, 'adminCommon.updateErrorFallback');
    expect(message).not.toBe('adminCommon.updateErrorFallback');
    expect(message.length).toBeGreaterThan(0);
  });
});
