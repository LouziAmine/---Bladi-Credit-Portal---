import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  SimulationDetailsComponent as SimulationDetails,
  summarizeAmortization,
} from './simulation-details.component';
import { DemandAmortizationResponse } from '../../../../../core/models/demand.model';
import { formatAmount, formatPercent } from '../../../../../core/utils/format.utils';
import { provideTranslateTesting } from '../../../../../testing/translate-testing.providers';
import { AMOUNT_110000, AMOUNT_11250, AMOUNT_1500, AMOUNT_1500000, AMOUNT_1825614, AMOUNT_260802, AMOUNT_325614, AMOUNT_7500, DECIMAL_21733_5, DECIMAL_23233_5, DECIMAL_323310_4, DECIMAL_3430_46, DECIMAL_6_15, DECIMAL_6_75, DECIMAL_823310_4 } from '../../../../../testing/mocks/mock-amounts';
import { REFERENCE_DEM_3F2A9C1B } from '../../../../../testing/mocks/mock-codes';

describe('SimulationDetails', () => {
  let fixture: ComponentFixture<SimulationDetails>;
  let component: SimulationDetails;

  const mockAmortization: DemandAmortizationResponse = {
    demandId: '1', reference: REFERENCE_DEM_3F2A9C1B, amount: AMOUNT_1500000, duration: 84, applicableRate: DECIMAL_6_75,
    processingFees: AMOUNT_11250, taeg: DECIMAL_6_15, amortizationSchedule: [],
    insurancePremium: AMOUNT_1500, allInMonthlyPayment: DECIMAL_23233_5, totalInsuranceCost: 126000,
    enterprise: { monthlyPayment: DECIMAL_21733_5, annualDebtService: AMOUNT_260802, totalInterest: AMOUNT_325614, totalCost: AMOUNT_1825614 },
    conventional: null,
    mourabaha: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationDetails],
      providers: [provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationDetails);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('template', () => {
    it('should render the amount, duration and applicable rate alongside the standard figures', () => {
      fixture.componentRef.setInput('amortization', mockAmortization);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Montant');
      expect(compiled.textContent).toContain(formatAmount(mockAmortization.amount));
      expect(compiled.textContent).toContain('Durée');
      expect(compiled.textContent).toContain('84 mois');
      expect(compiled.textContent).toContain('Taux applicable');
      expect(compiled.textContent).toContain(formatPercent(mockAmortization.applicableRate));
      expect(compiled.textContent).toContain('Mensualité');
    });

    it('should render nothing when there is no amortization data', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Montant');
    });

    it('should toggle the amortization schedule table', () => {
      fixture.componentRef.setInput('amortization', mockAmortization);
      fixture.detectChanges();
      expect(component['showSchedule']()).toBe(false);
      component.toggleSchedule();
      expect(component['showSchedule']()).toBe(true);
    });

    it('should show the PDF download button once amortization data is available', () => {
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.bi-file-earmark-pdf')).toBeFalsy();

      fixture.componentRef.setInput('amortization', mockAmortization);
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.bi-file-earmark-pdf')).toBeTruthy();
    });
  });

  describe('summarizeAmortization', () => {
    it('should return the enterprise figures as they are', () => {
      expect(summarizeAmortization(mockAmortization)).toEqual(mockAmortization.enterprise);
    });

    it('should use the conventional figures, without an annual debt service', () => {
      const conventional = { monthlyPayment: DECIMAL_3430_46, totalInterest: DECIMAL_323310_4, totalCost: DECIMAL_823310_4 };
      expect(summarizeAmortization({ ...mockAmortization, enterprise: null, conventional }))
        .toEqual({ ...conventional, annualDebtService: null });
    });

    it('should map the Mourabaha TTC figures', () => {
      const mourabaha = { marginHt: 100000, vatOnMargin: 10000, marginTtc: 110000, monthlyPaymentTtc: 7500 };
      expect(summarizeAmortization({ ...mockAmortization, enterprise: null, mourabaha })).toEqual({
        monthlyPayment: AMOUNT_7500,
        totalInterest: AMOUNT_110000,
        totalCost: mockAmortization.amount + 110000,
        annualDebtService: null,
      });
    });

    it('should return null when the amortization carries no product detail', () => {
      expect(summarizeAmortization({ ...mockAmortization, enterprise: null })).toBeNull();
    });
  });

  describe('downloadPdf', () => {
    it('should do nothing when there is no amortization data', () => {
      fixture.detectChanges();
      expect(() => component.downloadPdf()).not.toThrow();
    });

    it('should build the PDF and offer it under a name carrying the dossier reference', () => {
      const save = vi.spyOn(component as unknown as { savePdf: () => void }, 'savePdf').mockImplementation(() => undefined);
      fixture.componentRef.setInput('amortization', mockAmortization);
      fixture.detectChanges();

      component.downloadPdf();

      expect(save).toHaveBeenCalledWith(expect.anything(), expect.stringMatching(/^simulation-DEM-3F2A9C1B-.+\.pdf$/));
    });
  });
});
