import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentSimulationResultComponent } from './investment-simulation-result.component';
import { InvestmentCreditResponse } from '../../../core/models/investment-credit.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_14400, AMOUNT_15000, AMOUNT_1500000, AMOUNT_1839600, AMOUNT_21900, AMOUNT_262800, AMOUNT_339600, AMOUNT_6, AMOUNT_7500, DECIMAL_6_4 } from '../../../testing/mocks/mock-amounts';
import { CODE_PME, REFERENCE_DEM_3F2A9C1B } from '../../../testing/mocks/mock-codes';
import { COMPANY_ATLAS_TEXTILE_SARL } from '../../../testing/mocks/mock-contacts';

describe('InvestmentSimulationResultComponent', () => {
  let fixture: ComponentFixture<InvestmentSimulationResultComponent>;

  const result: InvestmentCreditResponse = {
    companyName: COMPANY_ATLAS_TEXTILE_SARL, enterpriseType: CODE_PME, sector: null, amount: AMOUNT_1500000, duration: 84,
    applicableRate: AMOUNT_6, monthlyPayment: AMOUNT_21900, annualDebtService: AMOUNT_262800, totalInterest: AMOUNT_339600, totalCost: AMOUNT_1839600,
    processingFees: AMOUNT_15000, taeg: DECIMAL_6_4, demandReference: REFERENCE_DEM_3F2A9C1B,
    amortizationSchedule: [{
      installmentNumber: 1, beginningBalance: 1500000, interest: AMOUNT_7500, marginHt: null, vatOnMargin: null,
      marginTtc: null, principal: AMOUNT_14400, payment: AMOUNT_21900, endingBalance: 1485600,
    }],
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentSimulationResultComponent],
      providers: [provideTranslateTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InvestmentSimulationResultComponent);
  });

  it('invites the company to simulate while there is no result', () => {
    fixture.detectChanges();

    expect(element().querySelector('.cb-empty')).not.toBeNull();
  });

  it('shows the dossier reference of the offer', () => {
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    expect(element().textContent).toContain(REFERENCE_DEM_3F2A9C1B);
  });

  it('opens and closes the amortization schedule', () => {
    fixture.componentRef.setInput('result', result);
    fixture.detectChanges();

    fixture.componentInstance.toggleSchedule();
    fixture.detectChanges();
    expect(element().querySelector('.cb-schedule-table-wrap')).not.toBeNull();

    fixture.componentInstance.toggleSchedule();
    fixture.detectChanges();
    expect(element().querySelector('.cb-schedule-table-wrap')).toBeNull();
  });
});
