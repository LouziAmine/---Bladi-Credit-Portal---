import { test, expect } from '@playwright/test';
import { backendIsUp, login, AUTH_FILE, SEEDED_MANAGER } from './helpers';

const SHOT = 'docs/screenshots/e2e/auth';

test.describe('Authentication flow', () => {
  test('login form rejects empty submission client-side (no request sent)', async ({ page }) => {
    let loginRequestSent = false;
    await page.route('**/api/v1/auth/login', (route) => {
      loginRequestSent = true;
      return route.continue();
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/requis/i).first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-login-empty-validation.png`, fullPage: true, animations: 'disabled' });
    expect(loginRequestSent).toBe(false);
  });

  test('login form enforces minimum length client-side', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/nom d'utilisateur/i).fill('ab');
    await page.getByLabel(/mot de passe/i).fill('12345');
    await page.getByRole('button', { name: /se connecter/i }).blur();
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/minimum 3 caractères/i)).toBeVisible();
    await expect(page.getByText(/minimum 6 caractères/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-login-min-length-validation.png`, fullPage: true, animations: 'disabled' });
  });

  test('invalid credentials surface the API error without leaking stack traces', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await login(page, 'nonexistent-user', 'wrong-password');

    await expect(page.getByText(/identifiants invalides|invalid/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT}/03-login-invalid-credentials.png`, fullPage: true, animations: 'disabled' });
    await expect(page.locator('body')).not.toContainText('Exception');
    await expect(page.locator('body')).not.toContainText('.java:');
  });

  test('valid credentials log the user in and redirect to /simulation', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await login(page, SEEDED_MANAGER.username, SEEDED_MANAGER.password);

    await expect(page).toHaveURL(/\/simulation$/);
    await page.screenshot({ path: `${SHOT}/04-login-success.png`, fullPage: true, animations: 'disabled' });
  });

  test('auth guard redirects an unauthenticated user away from /admin', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login$/);
    await page.screenshot({ path: `${SHOT}/05-guard-unauthenticated-redirect.png`, fullPage: true, animations: 'disabled' });
  });

  test('unknown routes fall back to /simulation', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveURL(/\/simulation$/);
    await page.screenshot({ path: `${SHOT}/06-unknown-route-fallback.png`, fullPage: true, animations: 'disabled' });
  });
});

test.describe('Authenticated navigation', () => {
  test.use({ storageState: AUTH_FILE });

  test('guest guard redirects an authenticated user away from /login', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/login');
    await expect(page).toHaveURL(/\/simulation$/);
    await page.screenshot({ path: `${SHOT}/07-guest-guard-redirect.png`, fullPage: true, animations: 'disabled' });
  });
});

test.describe('Manager guard - CLIENT role', () => {
  test('a logged-in CLIENT is redirected away from /admin back to /simulation', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    const username = `e2e-client-guard-${Date.now()}`;
    await page.goto('/register');
    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('ValidPass1234');
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

    await login(page, username, 'ValidPass1234');
    await expect(page).toHaveURL(/\/simulation$/);

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/simulation$/);
    await page.screenshot({ path: `${SHOT}/08-client-guard-redirect.png`, fullPage: true, animations: 'disabled' });
  });
});