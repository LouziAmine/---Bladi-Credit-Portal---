import { test, expect, Page } from '@playwright/test';
import { backendIsUp } from './helpers';
import { company } from './world';

const SHOT = 'docs/screenshots/e2e/investment-credit';

interface Company {
  companyName?: string;
  enterpriseType?: string;
  sector?: string;
  email?: string;
  companyAgeYears?: string;
  amount?: string;
  duration?: string;
  annualRevenue?: string;
  netAnnualResult?: string;
  existingAnnualDebtService?: string;
  guaranteesValue?: string;
}

async function fill(page: Page, over: Company = {}): Promise<void> {
  const c = company();
  const values: Required<Company> = {
    companyName: c.name, enterpriseType: 'PME', sector: '', email: c.contactEmail,
    companyAgeYears: '5', amount: '1500000', duration: '84', annualRevenue: '8000000', netAnnualResult: '1200000',
    existingAnnualDebtService: '100000', guaranteesValue: '1300000', ...over,
  };
  await page.locator('#companyName').fill(values.companyName);
  await page.locator('#enterpriseType').selectOption(values.enterpriseType);
  await page.locator('#email').fill(values.email);
  await page.locator('#phone').fill(c.contact.phone);
  await page.locator('#companyAgeYears').fill(values.companyAgeYears);
  await page.locator('#amount').fill(values.amount);
  await page.locator('#duration').fill(values.duration);
  await page.locator('#annualRevenue').fill(values.annualRevenue);
  await page.locator('#netAnnualResult').fill(values.netAnnualResult);
  await page.locator('#existingAnnualDebtService').fill(values.existingAnnualDebtService);
  await page.locator('#guaranteesValue').fill(values.guaranteesValue);
}

const simulate = (page: Page) => page.locator('form button[type=submit]').click();

test.describe('Investment credit simulator (public)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
    await page.goto('/investment-credit');
  });

  test('empty form shows the simulator and the empty result panel', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /simulateur de crédit entreprise/i })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-empty-form.png`, fullPage: true, animations: 'disabled' });
  });

  test('an eligible PME gets an offer and a tracked dossier reference', async ({ page }) => {
    await fill(page);
    await simulate(page);
    await expect(page.getByText('Éligible', { exact: true })).toBeVisible();
    await expect(page.locator('.cb-alert--success')).toContainText(/DEM-[0-9A-F]+/);
    await expect(page.getByText('Taux applicable').first()).toBeVisible();
    await expect(page.getByText('Mensualité').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-pme-eligible.png`, fullPage: true, animations: 'disabled' });
  });

  test('an eligible large enterprise (GE) is accepted too', async ({ page }) => {
    await fill(page, { enterpriseType: 'GE', amount: '3000000', guaranteesValue: '3000000', netAnnualResult: '3000000' });
    await simulate(page);
    await expect(page.locator('.cb-alert--success')).toContainText(/DEM-[0-9A-F]+/);
    await page.screenshot({ path: `${SHOT}/03-ge-eligible.png`, fullPage: true, animations: 'disabled' });
  });

  test('the amortization schedule opens after a successful simulation', async ({ page }) => {
    await fill(page);
    await simulate(page);
    await expect(page.getByText('Éligible', { exact: true })).toBeVisible();
    await page.locator('.cb-card-header-clickable').click();
    await expect(page.locator('table').last()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-amortization-schedule.png`, fullPage: true, animations: 'disabled' });
  });

  const rejections: [string, string, Company][] = [
    ['05-rejected-company-too-young', 'company younger than the minimum age', { companyAgeYears: '0' }],
    ['06-rejected-financing-ratio', 'amount above the financing-to-revenue ratio', { annualRevenue: '1000000' }],
    ['07-rejected-guarantee-coverage', 'guarantees below the required coverage', { guaranteesValue: '1000' }],
    ['08-rejected-debt-service', 'debt service above the cap', { netAnnualResult: '100000' }],
  ];
  for (const [shot, title, over] of rejections) {
    test(`rejected: ${title} surfaces the business reason, no dossier`, async ({ page }) => {
      await fill(page, over);
      await simulate(page);
      await expect(page.locator('.cb-alert--danger')).toBeVisible();
      await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
      await expect(page.locator('.cb-alert--success')).toHaveCount(0);
      await page.screenshot({ path: `${SHOT}/${shot}.png`, fullPage: true, animations: 'disabled' });
    });
  }

  test('required fields block the submission client-side', async ({ page }) => {
    let sent = false;
    await page.route('**/api/v1/investment-credit', (route) => {
      sent = true;
      return route.continue();
    });
    await simulate(page);
    await expect(page.locator('.cb-field-error').first()).toBeVisible();
    expect(sent).toBe(false);
    await page.screenshot({ path: `${SHOT}/09-required-fields.png`, fullPage: true, animations: 'disabled' });
  });

  test('reset clears the form and the result', async ({ page }) => {
    await fill(page);
    await simulate(page);
    await expect(page.getByText('Éligible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /réinitialiser/i }).click();
    await expect(page.locator('#companyName')).toHaveValue('');
    await expect(page.getByText('Éligible', { exact: true })).toHaveCount(0);
  });
});
