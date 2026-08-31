import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { InvitationsComponent } from './invitations.component';
import { ClientInvitationService } from '../../core/services/client-invitation-service/client-invitation.service';
import { ClientInvitationPreviewResponse } from '../../core/models/client-invitation.model';
import { provideTranslateTesting } from '../../testing/translate-testing.providers';
import { COMPANY_ATLAS_TEXTILE_SARL, EMAIL_CONTACT_AT_ATLAS_MA, EMAIL_SALMA_AT_GMAIL_COM } from '../../testing/mocks/mock-contacts';
import { DATE_2026_10_18T10_00_00Z } from '../../testing/mocks/mock-dates';

describe('InvitationsComponent', () => {
  let fixture: ComponentFixture<InvitationsComponent>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  async function open(preview: ClientInvitationPreviewResponse): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InvitationsComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideTranslateTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 't-1' }) } } },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(ClientInvitationService), 'preview').mockReturnValue(of(preview));
    fixture = TestBed.createComponent(InvitationsComponent);
    fixture.detectChanges();
  }

  it('welcomes an enterprise contact to their company', async () => {
    await open({ email: EMAIL_CONTACT_AT_ATLAS_MA, enterpriseName: COMPANY_ATLAS_TEXTILE_SARL, demandReference: null,
      expiresAt: DATE_2026_10_18T10_00_00Z });

    expect(element().querySelector('h1')?.textContent).toContain('entreprise');
    expect(element().querySelector('.cb-card__header-title')?.textContent).toContain(COMPANY_ATLAS_TEXTILE_SARL);
  });

  it('welcomes a mortgage borrower to their own dossier', async () => {
    await open({ email: EMAIL_SALMA_AT_GMAIL_COM, enterpriseName: null, demandReference: 'DEM-MORTGAGE1',
      expiresAt: DATE_2026_10_18T10_00_00Z });

    expect(element().querySelector('h1')?.textContent).toContain('crédit immobilier');
    expect(element().querySelector('.cb-card__header-title')?.textContent).toContain('DEM-MORTGAGE1');
  });
});
