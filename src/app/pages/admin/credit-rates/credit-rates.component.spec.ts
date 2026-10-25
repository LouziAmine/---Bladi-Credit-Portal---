import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { CreditRatesComponent } from './credit-rates.component';
import { CreditRateService } from '../../../core/services/credit-rate-service/credit-rate.service';
import { CreditRateResponse } from '../../../core/models/credit-rate.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_7, DECIMAL_4_2, DECIMAL_6_5 } from '../../../testing/mocks/mock-amounts';
import { CODE_MIN, CODE_SALA } from '../../../testing/mocks/mock-codes';

describe('CreditRatesComponent', () => {
  let fixture: ComponentFixture<CreditRatesComponent>;
  let component: CreditRatesComponent;
  let service: CreditRateService;

  const rate: CreditRateResponse = {
    id: 'r-1', cspCode: CODE_SALA, rateMin: DECIMAL_4_2, rateMax: DECIMAL_6_5, rateFormula: CODE_MIN,
    minDurationMonths: 12, maxDurationMonths: 300, active: true,
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditRatesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditRatesComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(CreditRateService);
    vi.spyOn(service, 'getAll').mockReturnValue(
      of({ items: [rate], total: 1, lastPage: 1, currentPage: 1, size: 20 }));
    fixture.detectChanges();
  });

  it('lists the rates per CSP', () => {
    expect(element().querySelector('table')?.textContent).toContain(CODE_SALA);
  });

  it('saves an edited rate', () => {
    const patch = vi.spyOn(service, 'patch').mockReturnValue(of(undefined));
    component.selectRecord(rate);
    component['form'].patchValue({ rateMax: AMOUNT_7 });

    component.submit();

    expect(patch).toHaveBeenCalledWith('r-1', {
      rateMin: DECIMAL_4_2, rateMax: AMOUNT_7, minDurationMonths: 12, maxDurationMonths: 300, active: true,
    });
  });

  it('refuses a duration range with only one bound and says why', () => {
    const patch = vi.spyOn(service, 'patch');
    component.selectRecord(rate);
    component['form'].patchValue({ maxDurationMonths: null });

    component.submit();
    fixture.detectChanges();

    expect(patch).not.toHaveBeenCalled();
    expect(element().querySelector('.cb-alert--danger')).not.toBeNull();
  });
});
