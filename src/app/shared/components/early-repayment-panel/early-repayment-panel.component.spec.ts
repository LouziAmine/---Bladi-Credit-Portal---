import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EarlyRepaymentPanelComponent } from './early-repayment-panel.component';
import { EarlyRepaymentService } from '../../../core/services/early-repayment-service/early-repayment.service';
import { EarlyRepaymentQuoteResponse, EarlyRepaymentResponse } from '../../../core/models/early-repayment.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_100000, AMOUNT_1500, AMOUNT_800 } from '../../../testing/mocks/mock-amounts';
import { CODE_CLIENT, CODE_MANAGER } from '../../../testing/mocks/mock-codes';
import { DATE_2026_09_25, DATE_2026_09_25T10_00_00Z } from '../../../testing/mocks/mock-dates';
import { USER_MANAGER1 } from '../../../testing/mocks/mock-users';

describe('EarlyRepaymentPanelComponent', () => {
  let fixture: ComponentFixture<EarlyRepaymentPanelComponent>;
  let component: EarlyRepaymentPanelComponent;
  let service: EarlyRepaymentService;

  const mockQuote: EarlyRepaymentQuoteResponse = {
    fullRepayment: false, valueDate: DATE_2026_09_25, outstandingBefore: 400000, repaidPrincipal: 100000,
    accruedInterest: AMOUNT_800, indemnity: AMOUNT_1500, totalToPay: 102300, outstandingAfter: 300000,
    newMonthlyPayment: 3100, newSchedule: [],
  };

  const mockRepayment: EarlyRepaymentResponse = {
    id: 'r1', fullRepayment: false, outstandingBefore: 400000, repaidPrincipal: 100000, accruedInterest: AMOUNT_800,
    indemnity: AMOUNT_1500, totalPaid: 102300, outstandingAfter: 300000, performedBy: USER_MANAGER1,
    performedAt: DATE_2026_09_25T10_00_00Z,
  };

  function create(mode: 'CLIENT' | 'MANAGER'): void {
    fixture = TestBed.createComponent(EarlyRepaymentPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('demandId', 'd1');
    fixture.componentRef.setInput('mode', mode);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarlyRepaymentPanelComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();
    service = TestBed.inject(EarlyRepaymentService);
  });

  it('should quote as the client without loading the manager-only history', () => {
    const historySpy = vi.spyOn(service, 'history');
    const quoteSpy = vi.spyOn(service, 'quote').mockReturnValue(of(mockQuote));
    create(CODE_CLIENT);
    fixture.detectChanges();

    component['form'].setValue({ amount: AMOUNT_100000 });
    component.requestQuote();
    fixture.detectChanges();

    expect(historySpy).not.toHaveBeenCalled();
    expect(quoteSpy).toHaveBeenCalledWith('d1', 100000, true);
    expect(component['quote']()).toEqual(mockQuote);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Enregistrer le remboursement reçu');
  });

  it('should record the quoted amount as the manager, then reload the history and emit', () => {
    const historySpy = vi.spyOn(service, 'history').mockReturnValue(of([]));
    vi.spyOn(service, 'quote').mockReturnValue(of(mockQuote));
    const repaySpy = vi.spyOn(service, 'repay').mockReturnValue(of(mockRepayment));
    create(CODE_MANAGER);
    const emitted: EarlyRepaymentResponse[] = [];
    component.repaid.subscribe((r) => emitted.push(r));
    fixture.detectChanges();

    component['form'].setValue({ amount: AMOUNT_100000 });
    component.requestQuote();
    component.record();

    expect(repaySpy).toHaveBeenCalledWith('d1', { amount: AMOUNT_100000 });
    expect(historySpy).toHaveBeenCalledTimes(2);
    expect(emitted).toEqual([mockRepayment]);
    expect(component['quote']()).toBeNull();
  });

  it('should send an empty body for a total repayment', () => {
    vi.spyOn(service, 'history').mockReturnValue(of([]));
    vi.spyOn(service, 'quote').mockReturnValue(of({ ...mockQuote, fullRepayment: true }));
    const repaySpy = vi.spyOn(service, 'repay').mockReturnValue(of(mockRepayment));
    create(CODE_MANAGER);
    fixture.detectChanges();

    component.requestQuote();
    component.record();

    expect(repaySpy).toHaveBeenCalledWith('d1', {});
  });

  it('should surface the API error description', () => {
    vi.spyOn(service, 'quote').mockReturnValue(throwError(() =>
      new HttpErrorResponse({ error: { description: 'Échéances en retard.' }, status: 409 })));
    create(CODE_CLIENT);
    fixture.detectChanges();

    component.requestQuote();

    expect(component['errorMessage']()).toBe('Échéances en retard.');
  });
});
