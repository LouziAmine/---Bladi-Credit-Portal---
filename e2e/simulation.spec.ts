import { test, expect } from '@playwright/test';
import { backendIsUp } from './helpers';

const SHOT = 'docs/screenshots/e2e/simulation';

test.describe('Simulation scenarios', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');
    await page.goto('/simulation');
  });

  test('conventional loan (SALA profile) returns a full BAM-compliant breakdown', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.getByText('BAM conforme')).toBeVisible();
    await expect(page.getByText('Taux annuel')).toBeVisible();
    await expect(page.getByText('Mensualité tout compris')).toBeVisible();
    await expect(page.getByText('Intérêts totaux')).toBeVisible();
    await expect(page.getByText('Coût total')).toBeVisible();
    await expect(page.getByText('Assurance ADI')).toBeVisible();
    await expect(page.getByText('Taux de profit (Mourabaha)')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/01-conventional-accepted.png`, fullPage: true, animations: 'disabled' });
  });

  test('Mourabaha (participative) financing shows margin/VAT, not an interest rate', async ({ page }) => {
    await page.locator('label[for="productMourabaha"]').click();
    await expect(page.getByText(/financement participatif conforme à la charia/i)).toBeVisible();

    await page.locator('#amount').fill('240000');
    await page.locator('#duration').fill('60');
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('40');
    await page.getByLabel(/valeur du bien/i).fill('300000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.getByText('BAM conforme')).toBeVisible();
    await expect(page.getByText('Taux de profit (Mourabaha)')).toBeVisible();
    await expect(page.getByText('Marge TTC')).toBeVisible();
    await expect(page.getByText('Échéance TTC')).toBeVisible();
    await expect(page.getByText('Taux annuel')).toHaveCount(0);
    await expect(page.getByText('Intérêts totaux')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/02-mourabaha-accepted.png`, fullPage: true, animations: 'disabled' });
  });

  test('co-borrower toggle reveals a second income field and still simulates successfully', async ({ page }) => {
    await expect(page.locator('#coBorrowerMonthlyIncome')).toHaveCount(0);

    await page.getByLabel(/prêt avec co-emprunteur/i).check();
    await expect(page.locator('#coBorrowerMonthlyIncome')).toBeVisible();
    await page.locator('#coBorrowerMonthlyIncome').fill('8000');
    await page.screenshot({ path: `${SHOT}/03-coborrower-toggle.png`, fullPage: true, animations: 'disabled' });

    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.getByText('BAM conforme')).toBeVisible();
  });

  test('amortization schedule table expands and collapses after a successful simulation', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();
    await expect(page.getByText('BAM conforme')).toBeVisible();

    const toggle = page.getByRole('button', { name: /tableau d'amortissement/i });
    await expect(page.locator('table.cb-table')).toHaveCount(0);

    await toggle.click();
    const table = page.locator('table.cb-table');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-amortization-schedule-conventional.png`, fullPage: true, animations: 'disabled' });

    await toggle.click();
    await expect(page.locator('table.cb-table')).toHaveCount(0);
  });

  test('a BAM-rejected scenario (age-at-maturity ceiling exceeded) surfaces a real error, not a crash', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('60');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await expect(page.locator('body')).not.toContainText('Exception');
    await expect(page.locator('body')).not.toContainText('"errorCode"');
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/05-rejected-age-at-maturity.png`, fullPage: true, animations: 'disabled' });
  });

  test('reset clears the form and the result panel back to its empty state', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();
    await expect(page.getByText('BAM conforme')).toBeVisible();

    await page.getByRole('button', { name: /réinitialiser/i }).click();

    await expect(page.getByText('Votre simulation apparaîtra ici')).toBeVisible();
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/06-reset-form.png`, fullPage: true, animations: 'disabled' });
  });

  test('client-side validation blocks submission until required fields are filled', async ({ page }) => {
    let simulationRequestSent = false;
    await page.route('**/api/v1/simulation', (route) => {
      simulationRequestSent = true;
      return route.continue();
    });

    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.getByText('La CSP est requise.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/07-required-field-validation.png`, fullPage: true, animations: 'disabled' });
    expect(simulationRequestSent).toBe(false);
  });

  const cspScenarios = [
    ['FONC', 'Fonctionnaire', '240', '08'],
    ['RETR', 'Retraité', '180', '09'],
    ['PROF', 'Profession libérale', '120', '10'],
    ['INDE', 'Indépendant', '120', '11'],
  ] as const;

  for (const [csp, label, duration, shotIndex] of cspScenarios) {
    test(`${csp} (${label}) profile simulates successfully within its own rate/duration bracket`, async ({ page }) => {
      await page.getByLabel(/catégorie socio-professionnelle/i).selectOption(csp);
      await page.locator('#duration').fill(duration);
      await page.getByLabel(/âge de l'emprunteur/i).fill('35');
      await page.getByLabel(/valeur du bien/i).fill('600000');
      await page.getByLabel(/revenu mensuel net/i).fill('15000');
      await page.getByRole('button', { name: /simuler/i }).click();

      await expect(page.getByText('BAM conforme')).toBeVisible();
      await expect(page.getByText('Taux annuel')).toBeVisible();
      await page.screenshot({ path: `${SHOT}/${shotIndex}-csp-${csp.toLowerCase()}.png`, fullPage: true, animations: 'disabled' });
    });
  }

  test('Mourabaha financing is subject to the same age-at-maturity ceiling as conventional loans', async ({ page }) => {
    await page.locator('label[for="productMourabaha"]').click();
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('60');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/12-mourabaha-rejected-age-at-maturity.png`, fullPage: true, animations: 'disabled' });
  });

  test('a loan exceeding the LTV ceiling (insufficient deposit) is rejected', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('90000');
    await page.locator('#amount').fill('90000');
    await page.getByLabel(/revenu mensuel net/i).fill('15000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/13-rejected-ltv-deposit-insufficient.png`, fullPage: true, animations: 'disabled' });
  });

  test('a loan whose payment exceeds the max debt-to-income ratio is rejected', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('30');
    await page.getByLabel(/valeur du bien/i).fill('50000000');
    await page.locator('#amount').fill('20000000');
    await page.locator('#duration').fill('300');
    await page.getByLabel(/revenu mensuel net/i).fill('1000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/14-rejected-debt-ratio-exceeded.png`, fullPage: true, animations: 'disabled' });
  });

  test('a duration exceeding the CSP-specific bracket is rejected even within the slider range', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('PROF');
    await page.locator('#duration').fill('200');
    await page.getByLabel(/âge de l'emprunteur/i).fill('30');
    await page.getByLabel(/valeur du bien/i).fill('400000');
    await page.locator('#amount').fill('300000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await expect(page.getByText('BAM conforme')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/15-rejected-duration-out-of-range.png`, fullPage: true, animations: 'disabled' });
  });

  test('co-borrower monthly income is optional and does not block submission when left empty', async ({ page }) => {
    let simulationRequestSent = false;
    await page.route('**/api/v1/simulation', (route) => {
      simulationRequestSent = true;
      return route.continue();
    });

    await page.getByLabel(/prêt avec co-emprunteur/i).check();
    await page.locator('#coBorrowerMonthlyIncome').fill('');

    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('35');
    await page.getByLabel(/valeur du bien/i).fill('600000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();

    await expect(page.getByText('BAM conforme')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/16-coborrower-income-optional.png`, fullPage: true, animations: 'disabled' });
    expect(simulationRequestSent).toBe(true);
  });

  test('age outside the 18-74 bracket is blocked client-side', async ({ page }) => {
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('80');
    await page.getByLabel(/âge de l'emprunteur/i).blur();

    await expect(page.getByText('Doit être entre 18 et 74 ans.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/17-age-range-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('property value below the 80 000 MAD floor is blocked client-side', async ({ page }) => {
    await page.getByLabel(/valeur du bien/i).fill('50000');
    await page.getByLabel(/valeur du bien/i).blur();

    await expect(page.getByText('Entre 80 000 et 50 000 000 MAD.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/18-property-value-range-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('monthly income below the 1 000 MAD floor is blocked client-side', async ({ page }) => {
    await page.getByLabel(/revenu mensuel net/i).fill('500');
    await page.getByLabel(/revenu mensuel net/i).blur();

    await expect(page.getByText('Entre 1 000 et 5 000 000 MAD.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/19-monthly-income-range-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('Mourabaha amortization schedule table expands and collapses after a successful simulation', async ({ page }) => {
    await page.locator('label[for="productMourabaha"]').click();
    await page.locator('#amount').fill('240000');
    await page.locator('#duration').fill('60');
    await page.getByLabel(/catégorie socio-professionnelle/i).selectOption('SALA');
    await page.getByLabel(/âge de l'emprunteur/i).fill('40');
    await page.getByLabel(/valeur du bien/i).fill('300000');
    await page.getByLabel(/revenu mensuel net/i).fill('20000');
    await page.getByRole('button', { name: /simuler/i }).click();
    await expect(page.getByText('BAM conforme')).toBeVisible();

    const toggle = page.getByRole('button', { name: /tableau d'amortissement/i });
    await expect(page.locator('table.cb-table')).toHaveCount(0);

    await toggle.click();
    const table = page.locator('table.cb-table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Marge HT' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'TVA' })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/20-amortization-schedule-mourabaha.png`, fullPage: true, animations: 'disabled' });

    await toggle.click();
    await expect(page.locator('table.cb-table')).toHaveCount(0);
  });
});