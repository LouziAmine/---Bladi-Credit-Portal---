import { test, expect, Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test';
import { backendIsUp } from './helpers';
import {
  CLIENT_PASSWORD, RIB_OTHER, STAFF_PASSWORD, Staff, adminApi, apiAs, browserAs, completeDemand, currentStep, findDemand,
  mailMatch, publicApi, simulateMortgage, person, uid,
} from './world';

const SHOT = 'docs/screenshots/e2e/mortgage-workflow';

test.describe.serial('Back office - mortgage dossier workflow', () => {
  let admin: APIRequestContext;
  let staff: Staff;
  const contexts: BrowserContext[] = [];

  async function actor(browser: Browser, username: string): Promise<Page> {
    const context = await browserAs(browser, username, STAFF_PASSWORD);
    contexts.push(context);
    return context.newPage();
  }

  async function open(page: Page, demandId: string, reference: string): Promise<void> {
    await page.goto(`/admin/demands/${demandId}`);
    await expect(page.getByText(reference).first()).toBeVisible();
    await expect(page.locator('app-demand-pipeline')).toBeVisible();
  }

  async function classifyReal(browser: Browser, demandId: string, reference: string, owner: string): Promise<void> {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'));
    await open(page, demandId, reference);
    await page.getByRole('button', { name: /classifier le dossier/i }).first().click();
    await page.locator('label[for=classificationOutcomeREAL]').click();
    await expect(page.locator('#classifyEnterpriseId')).toHaveCount(0);
    await page.locator('#classifyAssigneeUsername').selectOption(owner);
    await page.locator('app-demand-classification button[type=submit]').click();
    await expect.poll(async () => (await currentStep(admin, demandId)).stepCode).toBe('MORTGAGE_INSTRUCTION_STEP');
  }

  async function advance(page: Page, assignee: string | null, decision?: string): Promise<void> {
    await page.getByRole('button', { name: /avancer \/ retourner le dossier/i }).click();
    await page.locator('label[for=rateOptionKEEP]').click();
    await page.locator('label[for=amountOptionKEEP]').click();
    await page.locator('label[for=durationOptionKEEP]').click();
    if (assignee) await page.locator('#assigneeUsername').selectOption(assignee);
    if (decision) await page.locator('#decisionOutcome').selectOption(decision);
    await page.getByRole('button', { name: /avancer le dossier$/i }).click();
  }

  test.beforeAll(async () => {
    admin = await adminApi();
    staff = await Staff.create(admin);
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
  });

  test.afterEach(async () => {
    await Promise.all(contexts.splice(0).map((c) => c.close()));
  });

  test('conventional mortgage: classified REAL without any enterprise, then four-eyes stops the instructor from deciding', async ({ browser }) => {
    const { reference } = await simulateMortgage();
    const demand = await findDemand(admin, reference);
    const instructor = staff.for(null, null, 0);
    await classifyReal(browser, demand.id, reference, instructor);

    const page = await actor(browser, instructor);
    await open(page, demand.id, reference);
    await page.screenshot({ path: `${SHOT}/01-mortgage-instruction.png`, fullPage: true, animations: 'disabled' });
    await advance(page, instructor);
    await expect.poll(async () => (await currentStep(admin, demand.id)).stepCode).toBe('MORTGAGE_DECISION_STEP');

    await page.reload();
    await advance(page, instructor, 'APPROVED');
    await expect(page.locator('.cb-alert--danger').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-four-eyes-violation.png`, fullPage: true, animations: 'disabled' });
    expect((await currentStep(admin, demand.id)).stepCode).toBe('MORTGAGE_DECISION_STEP');

    await page.getByRole('button', { name: /affecter \/ réaffecter/i }).click();
    await page.locator('#assignUsername').selectOption(staff.for(null, null, 1));
    await page.getByRole('button', { name: /(^|\s)affecter$/i }).click();
    await expect.poll(async () => (await currentStep(admin, demand.id)).assignedUsername).toBe(staff.for(null, null, 1));

    const decider = await actor(browser, staff.for(null, null, 1));
    await open(decider, demand.id, reference);
    await advance(decider, staff.for(null, null, 1), 'APPROVED');
    await expect.poll(async () => (await currentStep(admin, demand.id)).stepCode).toBe('MORTGAGE_EDITION_STEP');
    await decider.reload();
    await decider.screenshot({ path: `${SHOT}/03-decided-by-second-eyes.png`, fullPage: true, animations: 'disabled' });
  });

  test('committee refusal: the dossier is rejected, frozen, and the applicant is told by e-mail', async ({ browser }) => {
    const applicant = person('gmail.com');
    const email = applicant.email;
    const { reference } = await simulateMortgage({ applicantName: applicant.fullName, email, phone: applicant.phone });
    const demand = await findDemand(admin, reference);
    await classifyReal(browser, demand.id, reference, staff.for(null, null, 0));

    const instructor = await actor(browser, staff.for(null, null, 0));
    await open(instructor, demand.id, reference);
    await advance(instructor, staff.for(null, null, 1));
    await expect.poll(async () => (await currentStep(admin, demand.id)).stepCode).toBe('MORTGAGE_DECISION_STEP');

    const decider = await actor(browser, staff.for(null, null, 1));
    await open(decider, demand.id, reference);
    await advance(decider, staff.for(null, null, 1), 'REJECTED');
    await expect.poll(async () => (await findDemand(admin, reference)).rejected).toBe(true);
    await decider.reload();
    await expect(decider.getByRole('button', { name: /avancer \/ retourner le dossier/i })).toHaveCount(0);
    await decider.screenshot({ path: `${SHOT}/04-committee-refused.png`, fullPage: true, animations: 'disabled' });
    expect(await mailMatch(email, reference)).toBeTruthy();

    await decider.goto('/admin/demands');
    await decider.locator('#demandStatus').selectOption('REJECTED');
    await expect(decider.locator('tr', { hasText: reference })).toBeVisible();
    await decider.screenshot({ path: `${SHOT}/05-rejected-filter.png`, fullPage: true, animations: 'disabled' });
  });

  test('Mourabaha granted through to disbursement: credit file opens, early repayment is not offered', async ({ browser }) => {
    const { reference } = await simulateMortgage({ productType: 'MOURABAHA' });
    const demand = await findDemand(admin, reference);
    await classifyReal(browser, demand.id, reference, staff.for(null, null, 0));
    const instructor = await apiAs(staff.for(null, null, 0), STAFF_PASSWORD);
    await instructor.post(`/api/v1/demands/${demand.id}/advance`, {
      data: { rateOption: 'KEEP', amountOption: 'KEEP', durationOption: 'KEEP', assigneeUsername: staff.for(null, null, 1) },
    });
    await completeDemand(staff, demand.id);

    const page = await actor(browser, staff.for(null, null, 1));
    await open(page, demand.id, reference);
    const creditFile = page.locator('app-demand-credit-file');
    await expect(creditFile).toBeVisible();
    await expect(page.locator('app-early-repayment-panel')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/06-mourabaha-credit-file.png`, fullPage: true, animations: 'disabled' });
  });

  test('the borrower is invited by e-mail, creates an account, finds their mortgage and declares a payment', async ({ browser }) => {
    const { reference, body } = await simulateMortgage();
    const email = body['email'] as string;
    const demand = await findDemand(admin, reference);
    await classifyReal(browser, demand.id, reference, staff.for(null, null, 0));
    const instructor = await apiAs(staff.for(null, null, 0), STAFF_PASSWORD);
    await instructor.post(`/api/v1/demands/${demand.id}/advance`, {
      data: { rateOption: 'KEEP', amountOption: 'KEEP', durationOption: 'KEEP', assigneeUsername: staff.for(null, null, 1) },
    });
    await completeDemand(staff, demand.id);

    const token = await mailMatch(email, /invitations\/([A-Za-z0-9_-]+)/);
    const visitor = await browser.newContext({ locale: 'fr-FR' });
    contexts.push(visitor);
    const invitation = await visitor.newPage();
    await invitation.goto(`/invitations/${token}`);
    await expect(invitation.getByRole('heading', { level: 1 })).toContainText('crédit immobilier');
    await expect(invitation.locator('.cb-card__header-title')).toContainText(reference);
    const username = `borrower.${uid()}`;
    await invitation.locator('#username').fill(username);
    await invitation.locator('#password').fill(CLIENT_PASSWORD);
    await invitation.locator('form button[type=submit]').click();
    await expect(invitation.locator('.cb-alert--success')).toBeVisible();
    await invitation.screenshot({ path: `${SHOT}/07-borrower-invitation-accepted.png`, fullPage: true, animations: 'disabled' });

    const borrower = await browserAs(browser, username, CLIENT_PASSWORD);
    contexts.push(borrower);
    const page = await borrower.newPage();
    await page.goto('/portal');
    const mortgages = page.getByTestId('my-mortgages');
    await expect(mortgages).toContainText(reference);
    await page.screenshot({ path: `${SHOT}/08-borrower-portfolio.png`, fullPage: true, animations: 'disabled' });
    await mortgages.getByRole('link', { name: /ouvrir le dossier/i }).click();
    await expect(page).toHaveURL((url) => url.pathname === `/portal/mortgage/${demand.id}`);

    const declaring = page.locator('tr', { has: page.locator('input[type=text]') });
    await page.getByRole('button', { name: /j'ai payé/i }).first().click();
    await declaring.locator('input').fill(RIB_OTHER);
    await declaring.getByRole('button', { name: /confirmer/i }).click();
    await expect(page.getByText('Déclarée').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/09-borrower-payment-declared.png`, fullPage: true, animations: 'disabled' });

    const creditFile = await (await admin.get(`/api/v1/demands/${demand.id}/credit-file`)).json();
    const firstInstallment = creditFile.installments[0].id as string;
    const paid = await admin.post(
      `/api/v1/demands/${demand.id}/credit-file/installments/${firstInstallment}/payments/validate`);
    expect(paid.ok(), `manager validation -> ${paid.status()}`).toBeTruthy();
    expect((await paid.json()).status).toBe('PAID');
  });

  test('another client cannot open someone else\'s mortgage dossier', async () => {
    const { reference } = await simulateMortgage();
    const demand = await findDemand(admin, reference);
    const stranger = `stranger.${uid()}`;
    const pub = await publicApi();
    const registered = await pub.post('/api/v1/auth/register', { data: { username: stranger, password: CLIENT_PASSWORD } });
    expect(registered.ok(), `register -> ${registered.status()}`).toBeTruthy();
    await pub.dispose();
    const api = await apiAs(stranger, CLIENT_PASSWORD);
    expect((await api.get(`/api/v1/me/demands/${demand.id}/credit-file`)).status()).toBe(403);
    expect(await (await api.get('/api/v1/me/mortgage-demands')).json()).toEqual([]);
  });
});
