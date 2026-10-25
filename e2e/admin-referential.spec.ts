import { test, expect } from '@playwright/test';
import { AUTH_FILE, backendIsUp } from './helpers';
import { company, xlsxFile } from './world';

const NEW_SECTORS = ['Aquaculture', 'Recyclage', 'E-commerce', 'Santé', 'Éducation', 'Aéronautique', 'Automobile',
  'Offshoring', 'Mines', 'Pharmacie', 'Cosmétique', 'Artisanat', 'Immobilier', 'Télécoms', 'Distribution'];

const SHOT = 'docs/screenshots/e2e/admin-referential';
const HEADER = ['Entreprise', 'Type', 'Montant', 'Durée', 'Taux', 'Email', 'Téléphone', 'CA annuel',
  'Service dette', 'Résultat net', 'Garanties', 'Secteur', 'Ancienneté'];

test.describe('Admin - referential data and bulk import', () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
  });

  test('activity sectors: create one, then it is offered on the enterprise form', async ({ page }) => {
    await page.goto('/admin/activity-sectors');
    await expect(page.locator('#name')).toBeVisible();
    const listed = await page.locator('tbody').innerText().catch(() => '');
    const sector = NEW_SECTORS.find((s) => !listed.includes(s)) ?? `Secteur ${Date.now()}`;
    await page.locator('#name').fill(sector);
    await page.locator('form button[type=submit]').click();
    await expect(page.getByRole('cell', { name: sector })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-activity-sector-created.png`, fullPage: true, animations: 'disabled' });

    await page.locator('#name').fill(sector);
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-activity-sector-duplicate.png`, fullPage: true, animations: 'disabled' });

    await page.goto('/admin/enterprises');
    await expect(page.locator('#sector').getByRole('option', { name: sector, exact: true })).toHaveCount(1);
  });

  test('enterprises: create one with its RC/ICE number, listed with links to its portfolio and access', async ({ page }) => {
    const c = company();
    const name = c.name;
    const rc = c.registrationNumber;
    await page.goto('/admin/enterprises');
    await page.locator('#name').fill(name);
    await page.locator('#registrationNumber').fill(rc);
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('Entreprise créée avec succès.')).toBeVisible();

    const next = page.getByRole('button', { name: /suivant/i });
    while (await next.isEnabled() && (await page.getByRole('cell', { name, exact: true }).count()) === 0) {
      await next.click();
    }
    const row = page.locator('tr', { has: page.getByRole('cell', { name, exact: true }) });
    await expect(row).toContainText(rc);
    await page.screenshot({ path: `${SHOT}/03-enterprise-created.png`, fullPage: true, animations: 'disabled' });

    await row.locator('a[href*="/admin/demands"]').click();
    await expect(page).toHaveURL(/\/admin\/demands\?enterpriseId=/);
    await page.screenshot({ path: `${SHOT}/04-enterprise-portfolio-filter.png`, fullPage: true, animations: 'disabled' });
  });

  test('document suggestions: add one per CSP and per enterprise type, then delete it', async ({ page }) => {
    const label = 'Attestation de salaire (moins de 3 mois)';
    const pmeLabel = 'Bilans certifiés des 3 derniers exercices';
    await page.goto('/admin/document-suggestions');
    for (const existing of [label, pmeLabel]) {
      const row = page.locator('tr', { hasText: existing });
      while (await row.count()) {
        await row.first().getByRole('button').last().click();
        await expect(row).toHaveCount(0);
      }
    }
    await page.locator('#scope').selectOption('CSP:SALA');
    await page.locator('#label').fill(label);
    await page.locator('form button[type=submit]').click();
    const row = page.locator('tr', { hasText: label });
    await expect(row).toBeVisible();
    await page.screenshot({ path: `${SHOT}/05-document-suggestion-created.png`, fullPage: true, animations: 'disabled' });

    await page.locator('#scope').selectOption('CSP:SALA');
    await page.locator('#label').fill(label);
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.cb-alert--danger')).toBeVisible();

    await page.locator('#scope').selectOption('ENTERPRISE:PME');
    await page.locator('#label').fill(pmeLabel);
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('tr', { hasText: pmeLabel })).toBeVisible();

    await row.getByRole('button').last().click();
    await expect(page.locator('tr', { hasText: label })).toHaveCount(0);
  });

  test('investment credit parameters: update a grid, and a max rate above the legal TMIC is refused', async ({ page }) => {
    await page.goto('/admin/investment-credit-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await expect(page.locator('#rateMax')).not.toHaveValue('');
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('Mise à jour effectuée avec succès.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/06-investment-parameters-updated.png`, fullPage: true, animations: 'disabled' });

    await page.getByRole('button', { name: /modifier/i }).first().click();
    await page.locator('#rateMax').fill('15');
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/07-investment-parameters-above-tmic.png`, fullPage: true, animations: 'disabled' });
  });

  test('bulk import: valid rows become dossiers, invalid rows are reported with their reason', async ({ page }) => {
    const [pme, ge, badType, noEmail] = [company(), company(), company(), company()];
    const file = xlsxFile([
      HEADER,
      [pme.name, 'PME', 1500000, 84, null, pme.contactEmail, pme.contact.phone, 8000000, 100000, 1200000, 1300000, pme.sector, 5],
      [ge.name, 'GE', 3000000, 84, 6.5, ge.contactEmail, ge.contact.phone, 20000000, 0, 5000000, 3000000, ge.sector, 10],
      [badType.name, 'MULTINATIONALE', 1000, 12, null, badType.contactEmail, badType.contact.phone, null, null, null, null, null, null],
      [noEmail.name, 'PME', 500000, 60, null, null, noEmail.contact.phone, null, null, null, null, null, null],
    ]);
    await page.goto('/admin/demands/import');
    await page.locator('#demandImportFile').setInputFiles({ name: 'reprise-dossiers-agence-casablanca.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: file });
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.cb-stat__value').nth(0)).toHaveText('4', { timeout: 30000 });
    await expect(page.locator('.cb-stat__value').nth(1)).toHaveText('2');
    await expect(page.locator('table').last().getByRole('cell', { name: '4', exact: true })).toBeVisible();
    await expect(page.locator('table').last().getByRole('cell', { name: '5', exact: true })).toBeVisible();
    await expect(page.locator('table').last().locator('tbody tr')).toHaveCount(2);
    await page.screenshot({ path: `${SHOT}/08-demand-import-report.png`, fullPage: true, animations: 'disabled' });

    await page.goto(`/admin/demands`);
    await page.locator('#demandCompanyName').fill(pme.name);
    await expect(page.getByRole('cell', { name: pme.name, exact: true })).toBeVisible();
  });

  test('bulk import: a file that is not a real spreadsheet is refused', async ({ page }) => {
    await page.goto('/admin/demands/import');
    await page.locator('#demandImportFile').setInputFiles({ name: 'export-comptable.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('ceci n est pas un classeur') });
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/09-demand-import-invalid-file.png`, fullPage: true, animations: 'disabled' });
  });
});
