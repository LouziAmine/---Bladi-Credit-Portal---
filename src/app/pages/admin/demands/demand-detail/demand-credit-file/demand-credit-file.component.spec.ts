import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DemandCreditFileComponent } from './demand-credit-file.component';
import { CreditFileService } from '../../../../../core/services/credit-file-service/credit-file.service';
import { CreditFileResponse, InstallmentResponse } from '../../../../../core/models/credit-file.model';
import { provideTranslateTesting } from '../../../../../testing/translate-testing.providers';
import { AMOUNT_5000 } from '../../../../../testing/mocks/mock-amounts';
import { CODE_ACTIVE, CODE_DECLARED, CODE_MOURABAHA, CODE_PAID, CODE_PENDING } from '../../../../../testing/mocks/mock-codes';
import { PERSON_CREDIT_BLADI, RIB_011780000012345678901234, RIB_230780012345678901234567 } from '../../../../../testing/mocks/mock-contacts';
import { DATE_2026_09_01T10_00_00Z, DATE_2026_09_30T10_00_00Z, DATE_2026_10_01 } from '../../../../../testing/mocks/mock-dates';
import { USER_CLIENT1 } from '../../../../../testing/mocks/mock-users';

describe('DemandCreditFileComponent', () => {
  let fixture: ComponentFixture<DemandCreditFileComponent>;
  let component: DemandCreditFileComponent;
  let creditFileService: CreditFileService;

  const installment: InstallmentResponse = {
    id: 'i1', sequenceNumber: 1, dueDate: DATE_2026_10_01, amount: AMOUNT_5000, status: CODE_DECLARED, paidAt: null,
    declaredAt: DATE_2026_09_30T10_00_00Z, declaredBy: USER_CLIENT1, declaredSourceRib: RIB_230780012345678901234567,
    latePenalty: 0, totalDue: 5000,
  };

  const creditFile: CreditFileResponse = {
    id: 'cf1', demandId: 'd1', demandReference: 'DEM-1', companyName: 'Atlas', reference: 'CF-1',
    disbursedAt: DATE_2026_09_01T10_00_00Z, disbursedAmount: 100000, status: CODE_ACTIVE, installments: [installment],
    beneficiaryName: PERSON_CREDIT_BLADI, beneficiaryRib: RIB_011780000012345678901234, clientRib: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandCreditFileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    creditFileService = TestBed.inject(CreditFileService);
    vi.spyOn(creditFileService, 'getByDemandIdForManager').mockReturnValue(of(creditFile));
    fixture = TestBed.createComponent(DemandCreditFileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('demandId', 'd1');
  });

  it('should load the credit file on init', () => {
    fixture.detectChanges();
    expect(creditFileService.getByDemandIdForManager).toHaveBeenCalledWith('d1');
    expect(component['creditFile']()).toEqual(creditFile);
  });

  it('should validate a declared payment then reload the file', () => {
    fixture.detectChanges();
    vi.spyOn(creditFileService, 'validatePayment').mockReturnValue(of({ ...installment, status: CODE_PAID }));

    component.validatePayment('i1');

    expect(creditFileService.validatePayment).toHaveBeenCalledWith('d1', 'i1');
    expect(creditFileService.getByDemandIdForManager).toHaveBeenCalledTimes(2);
    expect(component['payingInstallmentId']()).toBeNull();
  });

  it('should require a reason before rejecting a payment', () => {
    fixture.detectChanges();
    const rejectSpy = vi.spyOn(creditFileService, 'rejectPayment');
    component.startRejectPayment('i1');

    component.confirmRejectPayment('i1');

    expect(rejectSpy).not.toHaveBeenCalled();
    expect(component['rejectPaymentReasonControl'].touched).toBe(true);
  });

  it('should reject a payment with the trimmed reason', () => {
    fixture.detectChanges();
    vi.spyOn(creditFileService, 'rejectPayment').mockReturnValue(of({ ...installment, status: CODE_PENDING }));
    component.startRejectPayment('i1');
    component['rejectPaymentReasonControl'].setValue('  Virement introuvable  ');

    component.confirmRejectPayment('i1');

    expect(creditFileService.rejectPayment).toHaveBeenCalledWith('d1', 'i1', 'Virement introuvable');
    expect(component['rejectingInstallmentId']()).toBeNull();
  });

  it('should surface the API error when validation fails', () => {
    fixture.detectChanges();
    vi.spyOn(creditFileService, 'validatePayment').mockReturnValue(throwError(() =>
      new HttpErrorResponse({ error: { description: 'Paiement non déclaré.' }, status: 409 })));

    component.validatePayment('i1');

    expect(component['creditFileErrorMessage']()).toBe('Paiement non déclaré.');
  });

  it('should hide the early repayment panel for a Mourabaha financing', () => {
    fixture.componentRef.setInput('productType', CODE_MOURABAHA);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-early-repayment-panel')).toBeNull();
  });
});
