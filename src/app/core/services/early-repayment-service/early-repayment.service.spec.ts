import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EarlyRepaymentService } from './early-repayment.service';
import { environment } from '../../../../environments/environment';
import { AMOUNT_5000 } from '../../../testing/mocks/mock-amounts';

describe('EarlyRepaymentService', () => {
  let service: EarlyRepaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EarlyRepaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET the manager quote with the amount for a partial repayment', () => {
    service.quote('d1', 100000, false).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/demands/d1/credit-file/early-repayments/quote`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('amount')).toBe('100000');
    req.flush({});
  });

  it('should GET the client quote under /me without an amount for a total repayment', () => {
    service.quote('d1', null, true).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/me/demands/d1/credit-file/early-repayments/quote`);
    expect(req.request.params.has('amount')).toBe(false);
    req.flush({});
  });

  it('should POST a repayment', () => {
    service.repay('d1', { amount: AMOUNT_5000 }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/d1/credit-file/early-repayments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: AMOUNT_5000 });
    req.flush({});
  });

  it('should GET the repayment history', () => {
    service.history('d1').subscribe((history) => expect(history).toEqual([]));

    const req = httpMock.expectOne(`${environment.apiUrl}/demands/d1/credit-file/early-repayments`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
