import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PortalDemandDetailComponent } from './portal-demand-detail.component';
import { ClientPortfolioService } from '../../../core/services/client-portfolio-service/client-portfolio.service';
import { ClientDocumentRequestService } from '../../../core/services/client-document-request-service/client-document-request.service';
import { CreditFileService } from '../../../core/services/credit-file-service/credit-file.service';
import { ClientDemandSummaryResponse } from '../../../core/models/enterprise-user-link.model';
import { CreditFileResponse, InstallmentResponse, InstallmentStatus } from '../../../core/models/credit-file.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_3500, AMOUNT_500000, DECIMAL_4_5 } from '../../../testing/mocks/mock-amounts';
import { CODE_ACTIVE, CODE_PAID, CODE_PENDING } from '../../../testing/mocks/mock-codes';
import { PERSON_CREDIT_BLADI, PERSON_SALMA_IDRISSI, RIB_230_780_0000000000000000_39 } from '../../../testing/mocks/mock-contacts';
import { DATE_2026_10_11, DATE_2026_10_11T10_00_00Z, DATE_2026_11_01 } from '../../../testing/mocks/mock-dates';

describe('PortalDemandDetailComponent', () => {
  let fixture: ComponentFixture<PortalDemandDetailComponent>;
  let portfolioService: ClientPortfolioService;

  const summary = (id: string, reference: string): ClientDemandSummaryResponse => ({
    id, reference, enterpriseType: null, amount: AMOUNT_500000, duration: 240, applicableRate: DECIMAL_4_5,
    createdAt: DATE_2026_10_11T10_00_00Z, completedAt: null, completed: false, rejected: false,
  });

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  async function open(params: Record<string, string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PortalDemandDetailComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    }).compileComponents();
    portfolioService = TestBed.inject(ClientPortfolioService);
    vi.spyOn(TestBed.inject(ClientDocumentRequestService), 'list').mockReturnValue(of([]));
    vi.spyOn(TestBed.inject(CreditFileService), 'getByDemandId')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
  }

  it('opens a mortgage dossier from the borrower\'s own mortgages and leads back to the portfolio', async () => {
    await open({ demandId: 'm-1' });
    vi.spyOn(portfolioService, 'getMyMortgageDemands')
      .mockReturnValue(of([summary('m-2', 'DEM-OTHER'), summary('m-1', 'DEM-MORTGAGE1')]));
    const enterpriseDemands = vi.spyOn(portfolioService, 'getPortfolioDemands');

    fixture = TestBed.createComponent(PortalDemandDetailComponent);
    fixture.detectChanges();

    expect(element().textContent).toContain('DEM-MORTGAGE1');
    expect(element().querySelector('a.cb-btn')?.getAttribute('href')).toBe('/portal');
    expect(enterpriseDemands).not.toHaveBeenCalled();
  });

  it('opens an investment dossier from its enterprise and leads back to the enterprise dossiers', async () => {
    await open({ enterpriseId: 'e-1', demandId: 'd-1' });
    vi.spyOn(portfolioService, 'getPortfolioDemands').mockReturnValue(of({
      items: [summary('d-1', 'DEM-INVEST1')], total: 1, lastPage: 1, currentPage: 1, size: 50,
    }));
    const mortgages = vi.spyOn(portfolioService, 'getMyMortgageDemands');

    fixture = TestBed.createComponent(PortalDemandDetailComponent);
    fixture.detectChanges();

    expect(element().textContent).toContain('DEM-INVEST1');
    expect(element().querySelector('a.cb-btn')?.getAttribute('href')).toBe('/portal/e-1/demands');
    expect(mortgages).not.toHaveBeenCalled();
  });

  it('shows the next unpaid installments first and the full schedule on demand', async () => {
    await open({ demandId: 'm-1' });
    vi.spyOn(portfolioService, 'getMyMortgageDemands').mockReturnValue(of([summary('m-1', 'DEM-MORTGAGE1')]));
    const installment = (n: number, status: InstallmentStatus): InstallmentResponse => ({
      id: `i-${n}`, sequenceNumber: n, dueDate: DATE_2026_11_01, amount: AMOUNT_3500, status, paidAt: null, declaredAt: null,
      declaredBy: null, declaredSourceRib: null, latePenalty: 0, totalDue: 3500,
    });
    const creditFile: CreditFileResponse = {
      id: 'cf-1', demandId: 'm-1', demandReference: 'DEM-MORTGAGE1', companyName: PERSON_SALMA_IDRISSI, reference: 'CF-1',
      disbursedAt: DATE_2026_10_11, disbursedAmount: 500000, status: CODE_ACTIVE, beneficiaryName: PERSON_CREDIT_BLADI,
      beneficiaryRib: RIB_230_780_0000000000000000_39, clientRib: null,
      installments: Array.from({ length: 30 }, (_, i) => installment(i + 1, i < 3 ? CODE_PAID : CODE_PENDING)),
    };
    vi.mocked(TestBed.inject(CreditFileService).getByDemandId).mockReturnValue(of(creditFile));

    fixture = TestBed.createComponent(PortalDemandDetailComponent);
    fixture.detectChanges();
    const firstColumn = (): string[] => [...element().querySelectorAll('tbody tr td:first-child')]
      .map((cell) => cell.textContent?.trim() ?? '');

    expect(firstColumn().slice(0, 12)).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 4)));
    (element().querySelector('[data-testid="toggle-schedule"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(firstColumn().filter((n) => /^\d+$/.test(n)).length).toBeGreaterThanOrEqual(30);
  });
});
