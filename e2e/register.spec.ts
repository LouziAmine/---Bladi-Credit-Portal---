import { test, expect } from '@playwright/test';
import { backendIsUp, AUTH_FILE, SEEDED_MANAGER } from './helpers';

const SHOT = 'docs/screenshots/e2e/register';

test.describe('Registration flow', () => {
  test('password complexity is enforced client-side before any request is sent', async ({ page }) => {
    let registerRequestSent = false;
    await page.route('**/api/v1/auth/register', (route) => {
      registerRequestSent = true;
      return route.continue();
    });

    await page.goto('/register');
    await page.getByLabel(/nom d'utilisateur/i).fill('newclient');
    await page.getByLabel(/mot de passe/i).fill('alllowercase1');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    await expect(page.getByText(/doit contenir une majuscule/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-password-complexity-validation.png`, fullPage: true, animations: 'disabled' });
    expect(registerRequestSent).toBe(false);
  });

  test('registering with an already-taken username surfaces the backend 409 as a real error', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/register');
    await page.getByLabel(/nom d'utilisateur/i).fill(SEEDED_MANAGER.username);
    await page.getByLabel(/mot de passe/i).fill('ValidPass1234');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    await expect(page.locator('.text-danger, .cb-alert--danger, [role="alert"]').filter({ hasText: /./ })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-duplicate-username-error.png`, fullPage: true, animations: 'disabled' });
  });

  test('a new CLIENT account can register and is redirected to login on success', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    const username = `e2e-register-${Date.now()}`;
    await page.goto('/register');
    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('ValidPass1234');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    await expect(page.getByText(/compte créé avec succès/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT}/03-register-success.png`, fullPage: true, animations: 'disabled' });
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('ValidPass1234');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/simulation$/);
  });

});

test.describe('Registration flow - authenticated', () => {
  test.use({ storageState: AUTH_FILE });

  test('guest guard redirects an authenticated user away from /register', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/register');
    await expect(page).toHaveURL(/\/simulation$/);
    await page.screenshot({ path: `${SHOT}/04-guest-guard-redirect.png`, fullPage: true, animations: 'disabled' });
  });
});