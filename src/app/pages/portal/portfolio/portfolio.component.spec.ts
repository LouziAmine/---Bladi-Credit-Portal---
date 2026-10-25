import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PortfolioComponent } from './portfolio.component';
import { ClientPortfolioService } from '../../../core/services/client-portfolio-service/client-portfolio.service';
import { ClientDemandSummaryResponse } from '../../../core/models/enterprise-user-link.model';
import { provideTranslateTesting } from '../../../testing/translate-testing.providers';
import { AMOUNT_500000, DECIMAL_4_5 } from '../../../testing/mocks/mock-amounts';
import { DATE_2026_10_11T10_00_00Z, DATE_2026_10_11T12_00_00Z } from '../../../testing/mocks/mock-dates';

describe('PortfolioComponent', () => {
  let fixture: ComponentFixture<PortfolioComponent>;
  let service: ClientPortfolioService;

  const mortgage: ClientDemandSummaryResponse = {
    id: 'm-1', reference: 'DEM-MORTGAGE1', enterpriseType: null, amount: AMOUNT_500000, duration: 240,
    applicableRate: DECIMAL_4_5, createdAt: DATE_2026_10_11T10_00_00Z, completedAt: DATE_2026_10_11T12_00_00Z,
    completed: true, rejected: false,
  };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting()],
    }).compileComponents();
    service = TestBed.inject(ClientPortfolioService);
    vi.spyOn(service, 'getMyEnterpriseLinks').mockReturnValue(of([]));
    vi.spyOn(service, 'getMyPortfolio').mockReturnValue(of([]));
    fixture = TestBed.createComponent(PortfolioComponent);
  });

  it('lists the borrower\'s mortgages with a link to each dossier', () => {
    vi.spyOn(service, 'getMyMortgageDemands').mockReturnValue(of([mortgage]));
    fixture.detectChanges();

    const card = element().querySelector('[data-testid="my-mortgages"]');
    expect(card?.textContent).toContain('DEM-MORTGAGE1');
    expect(card?.querySelector('a')?.getAttribute('href')).toBe('/portal/mortgage/m-1');
  });

  it('hides the mortgage section for a client without any mortgage', () => {
    vi.spyOn(service, 'getMyMortgageDemands').mockReturnValue(of([]));
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="my-mortgages"]')).toBeNull();
  });

  it('says so when the mortgages cannot be loaded', () => {
    vi.spyOn(service, 'getMyMortgageDemands').mockReturnValue(throwError(() => new Error('down')));
    fixture.detectChanges();

    expect(element().querySelector('[data-testid="my-mortgages"]')).toBeNull();
    expect(element().querySelector('app-error-message')?.textContent).toContain('crédits immobiliers');
  });
});
