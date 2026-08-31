import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DemandHistoryComponent } from './demand-history.component';
import { DemandService } from '../../../../../core/services/demand-service/demand.service';
import { DemandAmortizationResponse, DemandHistoryEntryResponse } from '../../../../../core/models/demand.model';
import { provideTranslateTesting } from '../../../../../testing/translate-testing.providers';
import { AMOUNT_1000, AMOUNT_100000, AMOUNT_115980, AMOUNT_15980, AMOUNT_1933, AMOUNT_1983, AMOUNT_23196, AMOUNT_50, AMOUNT_6, DECIMAL_6_4 } from '../../../../../testing/mocks/mock-amounts';
import { CODE_KEEP, CODE_MANUAL, CODE_RISK_ANALYSIS, CODE_RISK_ANALYSIS_STEP } from '../../../../../testing/mocks/mock-codes';
import { DATE_2026_08_01T10_00_00Z, DATE_2026_08_02T10_00_00Z } from '../../../../../testing/mocks/mock-dates';
import { USER_ADMIN } from '../../../../../testing/mocks/mock-users';

describe('DemandHistoryComponent', () => {
  let fixture: ComponentFixture<DemandHistoryComponent>;
  let component: DemandHistoryComponent;
  let demandService: DemandService;

  const entry: DemandHistoryEntryResponse = {
    processCode: CODE_RISK_ANALYSIS, processName: 'Analyse', stepCode: CODE_RISK_ANALYSIS_STEP, stepName: 'Analyse',
    typicalRole: null, requiredGradeCode: null, requiredGradeName: null, requiredTeamCode: null,
    requiredTeamName: null, assignedUsername: USER_ADMIN, assignedBy: null, enteredAt: DATE_2026_08_01T10_00_00Z,
    exitedAt: DATE_2026_08_02T10_00_00Z, decisionNote: null, decisionOutcome: null, returnReasonCode: null,
    recommendations: null, reserves: null, committeeType: null, insuranceAdiSubscribed: null,
    insuranceCoverageType: null, insuranceDamageSubscribed: null, rateOption: CODE_MANUAL, previousRate: 5,
    appliedRate: 6, rateChangedBy: USER_ADMIN, amountOption: CODE_KEEP, previousAmount: 100000, appliedAmount: 100000,
    durationOption: CODE_KEEP, previousDuration: 60, appliedDuration: 60, classificationOutcome: null,
  };

  const amortization: DemandAmortizationResponse = {
    demandId: 'd1', reference: 'DEM-1', amount: AMOUNT_100000, duration: 60, applicableRate: AMOUNT_6, processingFees: AMOUNT_1000,
    taeg: DECIMAL_6_4, amortizationSchedule: [], insurancePremium: AMOUNT_50, allInMonthlyPayment: AMOUNT_1983, totalInsuranceCost: 3000,
    enterprise: { monthlyPayment: AMOUNT_1933, annualDebtService: AMOUNT_23196, totalInterest: AMOUNT_15980, totalCost: AMOUNT_115980 },
    conventional: null, mourabaha: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandHistoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();

    demandService = TestBed.inject(DemandService);
    fixture = TestBed.createComponent(DemandHistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('demandId', 'd1');
    fixture.componentRef.setInput('history', [entry]);
    fixture.detectChanges();
  });

  it('should fetch the row simulation once, with the figures that step applied', () => {
    const spy = vi.spyOn(demandService, 'getAmortizationSchedule').mockReturnValue(of(amortization));

    component['toggleHistoryRow'](entry);
    component['toggleHistoryRow'](entry);
    component['toggleHistoryRow'](entry);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('d1', { rate: AMOUNT_6, amount: AMOUNT_100000, duration: 60 });
    expect(component['isHistoryRowExpanded'](entry)).toBe(true);
    expect(component['historyRowAmortization'](entry)).toEqual(amortization);
    expect(component['historyRowLoading'](entry)).toBe(false);
  });

  it('should keep the row error when the simulation fails', () => {
    vi.spyOn(demandService, 'getAmortizationSchedule').mockReturnValue(throwError(() =>
      new HttpErrorResponse({ error: { description: 'Taux invalide.' }, status: 422 })));

    component['toggleHistoryRow'](entry);

    expect(component['historyRowError'](entry)).toBe('Taux invalide.');
    expect(component['historyRowLoading'](entry)).toBe(false);
  });

  it('should not offer a preview for a step that set no figures', () => {
    expect(component['canPreviewHistoryRow']({ ...entry, appliedRate: null })).toBe(false);
  });
});
