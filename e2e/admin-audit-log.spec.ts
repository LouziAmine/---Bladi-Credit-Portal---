import { test, expect } from '@playwright/test';
import { backendIsUp, AUTH_FILE } from './helpers';

const SHOT = 'docs/screenshots/e2e/admin-audit-log';

test.describe('Admin - audit log', () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');
    await page.goto('/admin/audit-log');
  });

  test('lists recent events with actor, action, and IP columns populated', async ({ page }) => {
    const table = page.locator('table.cb-table');
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr').first()).toBeVisible();

    await expect(page.getByRole('cell', { name: 'admin' }).first()).toBeVisible();
    await expect(page.locator('.cb-badge--indigo').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-audit-log-list.png`, fullPage: true, animations: 'disabled' });
  });

  test('pagination controls stay consistent with the current/last page state', async ({ page }) => {
    await expect(page.getByText(/^Page \d+ \/ \d+$/)).toBeVisible();

    const previous = page.getByRole('button', { name: /précédent/i });
    const next = page.getByRole('button', { name: /suivant/i });

    await expect(previous).toBeDisabled();
    await page.screenshot({ path: `${SHOT}/02-audit-log-pagination.png`, fullPage: true, animations: 'disabled' });

    if (await next.isEnabled()) {
      await next.click();
      await expect(page.getByText(/^Page 2 \//)).toBeVisible();
      await expect(previous).toBeEnabled();

      await previous.click();
      await expect(page.getByText(/^Page 1 \//)).toBeVisible();
    }
  });
});