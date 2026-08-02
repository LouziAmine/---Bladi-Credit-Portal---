import { test, expect } from '@playwright/test';
import { backendIsUp, AUTH_FILE } from './helpers';

const SHOT = 'docs/screenshots/e2e/admin-parameters';

test.describe('Admin - parameter management', () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');
  });

  test('BAM parameters: selecting a record populates the form, and updating it succeeds', async ({ page }) => {
    await page.goto('/admin/bam-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();

    await expect(page.locator('#processingFeesRatio')).not.toHaveValue('');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    await expect(page.getByText('mis à jour avec succès')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-bam-update-success.png`, fullPage: true, animations: 'disabled' });
  });

  test('credit rates: updating a selected record succeeds', async ({ page }) => {
    await page.goto('/admin/credit-rates');
    await page.getByRole('button', { name: /modifier/i }).first().click();

    await expect(page.locator('#rateMin')).not.toHaveValue('');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    await expect(page.getByText('Taux mis à jour avec succès.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-credit-rates-update-success.png`, fullPage: true, animations: 'disabled' });
  });

  test('credit rates: duration min/max must be provided together (client-side)', async ({ page }) => {
    await page.goto('/admin/credit-rates');
    await page.getByRole('button', { name: /modifier/i }).first().click();

    await page.locator('#maxDurationMonths').fill('');
    await page.locator('#minDurationMonths').fill('60');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    await expect(page.getByText('Durée min et durée max doivent être renseignées ensemble.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/03-credit-rates-duration-pairing-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('Mourabaha parameters: updating a selected record succeeds', async ({ page }) => {
    await page.goto('/admin/mourabaha-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();

    await expect(page.locator('#profitRate')).not.toHaveValue('');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    await expect(page.getByText('mis à jour avec succès')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-mourabaha-update-success.png`, fullPage: true, animations: 'disabled' });
  });

  test('BAM parameters: cancel clears the selection and closes the edit form', async ({ page }) => {
    await page.goto('/admin/bam-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await expect(page.locator('#processingFeesRatio')).toBeVisible();

    await page.getByRole('button', { name: /annuler/i }).click();

    await expect(page.locator('#processingFeesRatio')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/05-bam-cancel.png`, fullPage: true, animations: 'disabled' });
  });

  test('BAM parameters: a negative ratio is blocked client-side (no PATCH sent)', async ({ page }) => {
    let patchSent = false;
    await page.route('**/api/v1/bam-parameters/**', (route) => {
      if (route.request().method() === 'PATCH') patchSent = true;
      return route.continue();
    });

    await page.goto('/admin/bam-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await page.locator('#processingFeesRatio').fill('-1');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    expect(patchSent).toBe(false);
    await expect(page.getByText('mis à jour avec succès')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/06-bam-negative-value-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('credit rates: a negative rate is blocked client-side (no PATCH sent)', async ({ page }) => {
    let patchSent = false;
    await page.route('**/api/v1/credit-rates/**', (route) => {
      if (route.request().method() === 'PATCH') patchSent = true;
      return route.continue();
    });

    await page.goto('/admin/credit-rates');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await page.locator('#rateMin').fill('-5');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    expect(patchSent).toBe(false);
    await expect(page.getByText('Taux mis à jour avec succès.')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/07-credit-rates-negative-value-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('credit rates: cancel clears the selection and closes the edit form', async ({ page }) => {
    await page.goto('/admin/credit-rates');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await expect(page.locator('#rateMin')).toBeVisible();

    await page.getByRole('button', { name: /annuler/i }).click();

    await expect(page.locator('#rateMin')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/08-credit-rates-cancel.png`, fullPage: true, animations: 'disabled' });
  });

  test('Mourabaha parameters: a negative profit rate is blocked client-side (no PATCH sent)', async ({ page }) => {
    let patchSent = false;
    await page.route('**/api/v1/mourabaha-parameters/**', (route) => {
      if (route.request().method() === 'PATCH') patchSent = true;
      return route.continue();
    });

    await page.goto('/admin/mourabaha-parameters');
    await page.getByRole('button', { name: /modifier/i }).first().click();
    await page.locator('#profitRate').fill('-2');
    await page.getByRole('button', { name: /mettre à jour/i }).click();

    expect(patchSent).toBe(false);
    await expect(page.getByText('mis à jour avec succès')).toHaveCount(0);
    await page.screenshot({ path: `${SHOT}/09-mourabaha-negative-value-validation.png`, fullPage: true, animations: 'disabled' });
  });
});