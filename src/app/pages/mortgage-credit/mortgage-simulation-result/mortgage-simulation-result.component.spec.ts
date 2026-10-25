import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MortgageSimulationResultComponent } from './mortgage-simulation-result.component';
import { AmortizationRow, MortgageCreditResponse } from '../../../core/models/mortgage-credit.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_1500, AMOUNT_2000, AMOUNT_20000, AMOUNT_2500, AMOUNT_3500, AMOUNT_35000, AMOUNT_5000, AMOUNT_500000, AMOUNT_7500, DECIMAL_4_5, DECIMAL_4_85 } from '../../../testing/mocks/mock-amounts';
import { CODE_CONVENTIONAL, CODE_MA, CODE_SALA, REFERENCE_DEM_3F2A9C1B, REFERENCE_DEM_AAAA0000 } from '../../../testing/mocks/mock-codes';

describe('MortgageSimulationResultComponent', () => {
  let fixture: ComponentFixture<MortgageSimulationResultComponent>;

  const row: AmortizationRow = {
    installmentNumber: 1, beginningBalance: 500000, interest: AMOUNT_2000, marginHt: null, vatOnMargin: null,
    marginTtc: null, principal: AMOUNT_1500, payment: AMOUNT_3500, endingBalance: 498500,
  };

  const result: MortgageCreditResponse = {
    amount: AMOUNT_500000, duration: 240, cspCode: CODE_SALA, productType: CODE_CONVENTIONAL, nationalityCode: CODE_MA,
    moroccanResident: true, age: 35, totalMonthlyIncome: AMOUNT_20000, applicableRate: DECIMAL_4_5, taeg: DECIMAL_4_85,
    registrationFees: AMOUNT_20000, landConservationFees: AMOUNT_7500, notaryFees: AMOUNT_5000, processingFees: AMOUNT_2500, totalFees: AMOUNT_35000,
    conventional: null, mourabaha: null, amortizationSchedule: [row], demandReference: REFERENCE_DEM_3F2A9C1B,
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MortgageSimulationResultComponent],
      providers: [provideTranslateTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(MortgageSimulationResultComponent);
  });

  it('invites the visitor to simulate while there is no result', () => {
    fixture.detectChanges();

    expect(element().querySelector('.cb-empty')).not.toBeNull();
  });

  it('shows the dossier reference and the TAEG of the offer', () => {
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    expect(element().textContent).toContain(REFERENCE_DEM_3F2A9C1B);
    expect(element().textContent).toContain('4.85 %');
  });

  it('reveals the amortization schedule on demand', () => {
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    expect(element().querySelector('.cb-schedule-table-wrap')).toBeNull();

    (element().querySelector('.cb-card-header-clickable') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element().querySelector('.cb-schedule-table-wrap')).not.toBeNull();
  });

  it('folds the schedule back when a new simulation comes in', () => {
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();
    fixture.componentInstance.toggleSchedule();
    fixture.detectChanges();

    fixture.componentRef.setInput('result', { ...result, demandReference: REFERENCE_DEM_AAAA0000 });
    fixture.detectChanges();

    expect(element().querySelector('.cb-schedule-table-wrap')).toBeNull();
  });
});
