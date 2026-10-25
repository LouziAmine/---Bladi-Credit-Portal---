import { test, expect, Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test';
import { backendIsUp } from './helpers';
import {
  CLIENT_PASSWORD, RIB_BAD_KEY, RIB_OTHER, RIB_VALID, STAFF_PASSWORD, Staff, adminApi, apiAs, browserAs, classifyApi,
  completeDemand, createEnterprise, findDemand, infectedDocx, mailMatch, pdfFile, registerClient, simulateInvestment,
  company, person, Company,
} from './world';

const SHOT = 'docs/screenshots/e2e/client-portal';

test.describe.serial('Client portal', () => {
  let admin: APIRequestContext;
  let staff: Staff;
  let enterprise: { id: string; name: string };
  let demandId: string;
  let reference: string;
  let contactEmail: string;
  let clientUsername: string;
  let atlas: Company;
  const contexts: BrowserContext[] = [];

  async function contextAs(browser: Browser, username: string, password: string): Promise<Page> {
    const context = await browserAs(browser, username, password);
    contexts.push(context);
    return context.newPage();
  }

  const client = (browser: Browser) => contextAs(browser, clientUsername, CLIENT_PASSWORD);
  const manager = (browser: Browser) => contextAs(browser, staff.for('GESTIONNAIRE', 'OGS_MEG'), STAFF_PASSWORD);

  async function openClientDossier(page: Page): Promise<void> {
    await page.goto(`/portal/${enterprise.id}/demands/${demandId}`);
    await expect(page.getByText(reference).first()).toBeVisible();
  }

  test.beforeAll(async () => {
    admin = await adminApi();
    staff = await Staff.create(admin);
    atlas = company();
    enterprise = await createEnterprise(admin, atlas.name, atlas.registrationNumber, atlas.sector);
    contactEmail = atlas.contactEmail;
    ({ reference } = await simulateInvestment({ companyName: atlas.name, sector: atlas.sector, email: contactEmail, phone: atlas.contact.phone }));
    demandId = (await findDemand(admin, reference)).id;
    await classifyApi(staff, demandId, enterprise.id, RIB_VALID);
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
  });

  test.afterEach(async () => {
    await Promise.all(contexts.splice(0).map((c) => c.close()));
  });

  test('the contact receives an invitation by e-mail and creates their account from it', async ({ page }) => {
    const token = await mailMatch(contactEmail, /invitations\/([A-Za-z0-9_-]+)/);
    await page.goto(`/invitations/${token}`);
    await expect(page.getByText(enterprise.name).first()).toBeVisible();
    await expect(page.getByText(contactEmail).first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-invitation-preview.png`, fullPage: true, animations: 'disabled' });
    for (let n = 1; ; n++) {
      clientUsername = n === 1 ? atlas.contact.username : `${atlas.contact.username}${n}`;
      await page.locator('#username').fill(clientUsername);
      await page.locator('#password').fill(CLIENT_PASSWORD);
      const answer = page.waitForResponse((r) => r.url().endsWith('/accept') && r.request().method() === 'POST');
      await page.locator('form button[type=submit]').click();
      if ((await answer).ok()) {
        await expect(page.locator('.cb-alert--success')).toBeVisible();
        break;
      }
      await expect(page.locator('.cb-alert--danger')).toBeVisible();
      expect(n, 'no free login for the invited contact').toBeLessThan(5);
    }
    await page.screenshot({ path: `${SHOT}/02-invitation-accepted.png`, fullPage: true, animations: 'disabled' });

    await page.goto(`/invitations/${token}`);
    await expect(page.locator('.cb-alert--danger')).toBeVisible();
  });

  test('the client logs in and sees the enterprise in their portfolio, then its dossiers', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/nom d'utilisateur/i).fill(clientUsername);
    await page.getByLabel(/mot de passe/i).fill(CLIENT_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/mortgage-credit$/);
    await page.goto('/portal');
    const row = page.locator('tr', { hasText: enterprise.name });
    await expect(row).toBeVisible();
    await page.screenshot({ path: `${SHOT}/03-portfolio.png`, fullPage: true, animations: 'disabled' });

    await row.getByRole('link').click();
    await expect(page).toHaveURL((url) => url.pathname === `/portal/${enterprise.id}/demands`);
    const dossier = page.locator('tr', { hasText: reference });
    await expect(dossier).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-enterprise-dossiers.png`, fullPage: true, animations: 'disabled' });
    await dossier.getByRole('link').click();
    await expect(page).toHaveURL((url) => url.pathname === `/portal/${enterprise.id}/demands/${demandId}`);
    await page.screenshot({ path: `${SHOT}/05-dossier-detail.png`, fullPage: true, animations: 'disabled' });
  });

  test('a requested document: an infected file is refused, a real one fulfils the request for the manager', async ({ browser }) => {
    const initiator = await apiAs(staff.for('CHARGE_AFFAIRES', 'RESEAU', 1), STAFF_PASSWORD);
    const created = await initiator.post(`/api/v1/demands/${demandId}/document-requests`, { data: { documentType: 'Bilan 2025 certifié' } });
    expect(created.ok()).toBeTruthy();

    const page = await client(browser);
    await openClientDossier(page);
    const row = page.locator('tr', { hasText: 'Bilan 2025 certifié' });
    await expect(row).toBeVisible();
    await page.screenshot({ path: `${SHOT}/06-document-requested.png`, fullPage: true, animations: 'disabled' });

    await row.locator('input[type=file]').setInputFiles({ name: 'bilan-2025.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: infectedDocx() });
    await expect(row.locator('.text-danger')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/07-document-infected-refused.png`, fullPage: true, animations: 'disabled' });

    await row.locator('input[type=file]').setInputFiles({ name: 'bilan-2025.pdf', mimeType: 'application/pdf', buffer: pdfFile('Bilan 2025') });
    await expect(row).toContainText(/fourni/i);
    await page.screenshot({ path: `${SHOT}/08-document-provided.png`, fullPage: true, animations: 'disabled' });

    const back = await contextAs(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU', 1), STAFF_PASSWORD);
    await back.goto(`/admin/demands/${demandId}`);
    const requests = back.locator('app-document-request-list');
    await expect(requests.locator('tr', { hasText: 'Bilan 2025 certifié' })).toContainText('Fourni');
    await requests.screenshot({ path: `${SHOT}/09-manager-sees-fulfilled-request.png`, animations: 'disabled' });
  });

  test('once the dossier is completed the client sees the credit file, its schedule and where to pay', async ({ browser }) => {
    await completeDemand(staff, demandId);
    const page = await client(browser);
    await openClientDossier(page);
    await expect(page.getByText('Actif').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /j'ai payé/i })).toHaveCount(12);
    await page.screenshot({ path: `${SHOT}/10-credit-file.png`, fullPage: true, animations: 'disabled' });
    await page.getByTestId('toggle-schedule').click();
    await expect(page.getByRole('button', { name: /j'ai payé/i })).toHaveCount(84);
    await page.getByTestId('toggle-schedule').click();
    await expect(page.getByRole('button', { name: /j'ai payé/i })).toHaveCount(12);
  });

  test('declaring a payment: a wrong RIB is refused, a valid one marks the installment as declared', async ({ browser }) => {
    const page = await client(browser);
    await openClientDossier(page);
    const payButtons = page.getByRole('button', { name: /j'ai payé/i });
    const declaring = page.locator('tr', { has: page.locator('input[type=text]') });
    await payButtons.first().click();
    await declaring.locator('input').fill(RIB_BAD_KEY);
    await declaring.getByRole('button', { name: /confirmer/i }).click();
    await expect(page.locator('.cb-alert--danger').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/11-declare-invalid-rib.png`, fullPage: true, animations: 'disabled' });

    await declaring.locator('input').fill(RIB_OTHER);
    await declaring.getByRole('button', { name: /confirmer/i }).click();
    await expect(page.getByText('Déclarée').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/12-payment-declared.png`, fullPage: true, animations: 'disabled' });

    await payButtons.first().click();
    await declaring.locator('input').fill(RIB_OTHER);
    await declaring.getByRole('button', { name: /confirmer/i }).click();
    await expect(page.getByText('Déclarée')).toHaveCount(2);
  });

  test('the manager validates one declared payment and rejects the other with a reason', async ({ browser }) => {
    const page = await manager(browser);
    await page.goto(`/admin/demands/${demandId}`);
    const creditFile = page.locator('app-demand-credit-file');
    await creditFile.getByRole('button', { name: /échéancier/i }).click();
    const declared = creditFile.locator('tbody tr').filter({ has: page.getByRole('button', { name: /valider/i }) });
    await expect(declared).toHaveCount(2);
    await page.screenshot({ path: `${SHOT}/13-manager-declared-payments.png`, fullPage: true, animations: 'disabled' });

    await declared.first().getByRole('button', { name: /valider/i }).click();
    await expect(declared).toHaveCount(1);

    await declared.first().getByRole('button', { name: /^\W*rejeter$/i }).click();
    await creditFile.locator('input[placeholder="Motif du rejet"]').fill('Virement introuvable sur le relevé.');
    await creditFile.getByRole('button', { name: /confirmer le rejet/i }).click();
    await expect(declared).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/14-manager-validated-and-rejected.png`, fullPage: true, animations: 'disabled' });

    const clientPage = await client(browser);
    await openClientDossier(clientPage);
    await clientPage.getByTestId('toggle-schedule').click();
    await expect(clientPage.getByText('Payée').first()).toBeVisible();
    await clientPage.screenshot({ path: `${SHOT}/15-client-sees-paid.png`, fullPage: true, animations: 'disabled' });
    expect(await mailMatch(contactEmail, /Virement introuvable/)).toBeTruthy();
  });

  test('the client simulates an early repayment of their credit', async ({ browser }) => {
    const page = await client(browser);
    await openClientDossier(page);
    const panel = page.locator('app-early-repayment-panel');
    await panel.locator('#earlyRepaymentAmount').fill('200000');
    await panel.getByRole('button', { name: /simuler/i }).click();
    await expect(panel).toContainText('Partiel');
    await expect(panel).toContainText('Indemnité (loi 31-08)');
    await expect(panel.getByRole('button', { name: /enregistrer/i })).toHaveCount(0);
    await panel.screenshot({ path: `${SHOT}/16-client-early-repayment-quote.png`, animations: 'disabled' });
  });

  test('the manager records a partial, then a total early repayment: the credit file is closed', async ({ browser }) => {
    const page = await manager(browser);
    await page.goto(`/admin/demands/${demandId}`);
    const panel = page.locator('app-early-repayment-panel');
    await panel.locator('#earlyRepaymentAmount').fill('200000');
    await panel.getByRole('button', { name: /simuler/i }).click();
    await expect(panel).toContainText('Nouvelle mensualité');
    await panel.getByRole('button', { name: /enregistrer le remboursement reçu/i }).click();
    await expect(panel.locator('tbody tr')).toHaveCount(1);
    await panel.screenshot({ path: `${SHOT}/17-partial-early-repayment.png`, animations: 'disabled' });

    await panel.locator('#earlyRepaymentAmount').fill('');
    await panel.getByRole('button', { name: /simuler/i }).click();
    await expect(panel).toContainText('Total');
    await panel.getByRole('button', { name: /enregistrer le remboursement reçu/i }).click();
    await expect(page.locator('app-demand-credit-file')).toContainText('Soldé');
    await page.screenshot({ path: `${SHOT}/18-credit-file-closed.png`, fullPage: true, animations: 'disabled' });

    const clientPage = await client(browser);
    await openClientDossier(clientPage);
    await expect(clientPage.getByText('Soldé').first()).toBeVisible();
    await expect(clientPage.getByRole('button', { name: /j'ai payé/i })).toHaveCount(0);
  });

  test('claiming an enterprise by its RC number: rejected, claimed again, approved, then revoked', async ({ browser }) => {
    const oasis = company();
    const rc = oasis.registrationNumber;
    const claimed = await createEnterprise(admin, oasis.name, rc, oasis.sector);
    const claimant = await registerClient(oasis.contact);
    const page = await contextAs(browser, claimant, CLIENT_PASSWORD);

    const claim = async (): Promise<void> => {
      await page.goto('/portal');
      await expect(page.getByText(/Aucune entreprise approuvée|Voir les dossiers/).first()).toBeVisible();
      await page.locator('#registrationNumber').fill(rc);
      await expect(page.locator('#registrationNumber')).toHaveValue(rc);
      await page.locator('#claimRole').selectOption('RESPONSABLE');
      await page.locator('form button[type=submit]').click();
      await expect(page.locator('.cb-alert--success')).toBeVisible();
    };
    await claim();
    await expect(page.locator('.cb-badge--amber', { hasText: 'En attente' })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/19-claim-pending.png`, fullPage: true, animations: 'disabled' });

    const back = await contextAs(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'), STAFF_PASSWORD);
    await back.goto('/admin/enterprise-links');
    const pending = back.locator('tr', { hasText: claimant });
    await expect(pending).toBeVisible();
    await back.screenshot({ path: `${SHOT}/20-manager-pending-claims.png`, fullPage: true, animations: 'disabled' });
    await pending.getByRole('button', { name: /rejeter/i }).click();
    await back.locator('input[type=text]').last().fill('Le demandeur n\'apparaît pas au registre du commerce de la société.');
    await back.getByRole('button', { name: /^\W*confirmer$/i }).click();
    await expect(back.locator('tr', { hasText: claimant })).toHaveCount(0);

    await claim();
    await back.reload();
    await back.locator('tr', { hasText: claimant }).getByRole('button', { name: /approuver/i }).click();
    await expect(back.locator('tr', { hasText: claimant })).toHaveCount(0);

    await page.goto('/portal');
    await expect(page.locator('tr', { hasText: claimed.name }).getByRole('link')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/21-claim-approved.png`, fullPage: true, animations: 'disabled' });

    await back.goto(`/admin/enterprise-links?enterpriseId=${claimed.id}`);
    const approvedLink = back.locator('tr', { hasText: claimant }).filter({ hasText: 'Approuvé' });
    await approvedLink.getByRole('button', { name: /révoquer/i }).click();
    await expect(back.locator('tr', { hasText: claimant }).filter({ hasText: 'Révoqué' })).toBeVisible();
    await expect(back.locator('tr', { hasText: claimant }).filter({ hasText: 'Rejeté' })).toBeVisible();
    await back.screenshot({ path: `${SHOT}/22-access-revoked.png`, fullPage: true, animations: 'disabled' });

    await page.goto(`/portal/${claimed.id}/demands`);
    await expect(page.locator('.cb-alert--danger')).toBeVisible();
  });

  test('a manager grants portfolio access directly to a registered client', async ({ browser }) => {
    const invited = await registerClient(person(atlas.contactEmail.split('@')[1]));
    const back = await contextAs(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'), STAFF_PASSWORD);
    await back.goto('/admin/enterprise-links');
    await back.locator('#linkEnterpriseId').fill(enterprise.id);
    await back.locator('#linkUsername').fill(invited);
    await back.locator('#linkRole').selectOption('DELEGUE');
    await back.locator('form button[type=submit]').first().click();
    await expect(back.locator('.cb-alert--success')).toBeVisible();
    await back.screenshot({ path: `${SHOT}/23-manager-invites-client.png`, fullPage: true, animations: 'disabled' });

    const page = await contextAs(browser, invited, CLIENT_PASSWORD);
    await page.goto('/portal');
    await expect(page.locator('tr', { hasText: enterprise.name })).toBeVisible();
  });

  test('a client without access cannot open another enterprise\'s dossier', async ({ browser }) => {
    const stranger = await registerClient();
    const page = await contextAs(browser, stranger, CLIENT_PASSWORD);
    await page.goto(`/portal/${enterprise.id}/demands/${demandId}`);
    await expect(page.locator('.cb-alert--danger').first()).toBeVisible();
    await expect(page.getByText('Bilan 2025 certifié')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/24-access-denied.png`, fullPage: true, animations: 'disabled' });
  });
});
