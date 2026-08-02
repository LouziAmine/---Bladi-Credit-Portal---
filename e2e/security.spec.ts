import { test, expect } from '@playwright/test';
import { backendIsUp, AUTH_FILE, SEEDED_MANAGER } from './helpers';

const SHOT = 'docs/screenshots/e2e/security';

test.describe('Security regressions - unauthenticated', () => {
  test('reflected input is never executed as script (stored/DOM XSS)', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', (dialog) => {
      dialogFired = true;
      void dialog.dismiss();
    });

    const payload = '<script>window.__xss__=true</script><img src=x onerror=alert(1)>';
    await page.goto('/login');
    await page.getByLabel(/nom d'utilisateur/i).fill(payload);
    await page.getByLabel(/mot de passe/i).fill('irrelevant');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOT}/01-xss-safe.png`, fullPage: true, animations: 'disabled' });
    expect(dialogFired).toBe(false);
    expect(await page.evaluate('window.__xss__')).toBeUndefined();
  });

  test('password field never renders with a visible autofill/autocomplete leak', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.getByLabel(/mot de passe/i);
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    await page.screenshot({ path: `${SHOT}/02-password-field-type.png`, fullPage: true, animations: 'disabled' });
  });
});

test.describe('Security regressions - authenticated', () => {
  test.use({ storageState: AUTH_FILE });

  test('no auth token is ever written to localStorage or sessionStorage', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/simulation');

    const storage = await page.evaluate(() => ({
      local: { ...window.localStorage },
      session: { ...window.sessionStorage },
    }));

    await page.screenshot({ path: `${SHOT}/03-no-token-in-storage.png`, fullPage: true, animations: 'disabled' });
    for (const store of [storage.local, storage.session]) {
      for (const value of Object.values(store)) {
        expect(String(value)).not.toMatch(/^eyJ/);
      }
    }
  });

  test('auth cookies are HttpOnly and SameSite=Strict', async ({ page, context }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/simulation');

    const cookies = await context.cookies();
    const authCookies = cookies.filter((c) => c.name.startsWith('cb_'));
    expect(authCookies.length).toBeGreaterThan(0);

    await page.screenshot({ path: `${SHOT}/04-cookies-httponly-samesite.png`, fullPage: true, animations: 'disabled' });
    for (const cookie of authCookies) {
      expect(cookie.httpOnly, `${cookie.name} must be HttpOnly`).toBe(true);
      expect(cookie.sameSite, `${cookie.name} must be SameSite=Strict`).toBe('Strict');
    }
  });

  test('an expired access token triggers a silent refresh instead of forcing re-login', async ({ page, context }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/simulation');

    const accessCookie = (await context.cookies()).find((c) => c.name === 'cb_access_token');
    expect(accessCookie, 'cb_access_token cookie must be set after login').toBeDefined();
    await context.addCookies([{ ...accessCookie!, value: 'tampered.invalid.token' }]);

    await page.getByRole('button', { name: /administration/i }).click();
    await page.getByRole('link', { name: /utilisateurs/i }).click();

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole('cell', { name: SEEDED_MANAGER.username })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/05-silent-refresh.png`, fullPage: true, animations: 'disabled' });
  });

  test('logout clears client-side auth state so /admin is inaccessible again', async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');

    await page.goto('/simulation');

    await page.evaluate(async () => {
      await fetch('http://localhost:8080/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    });
    await page.goto('/admin/users');

    await expect(page).toHaveURL(/\/login$/);
    await page.screenshot({ path: `${SHOT}/06-logout-clears-access.png`, fullPage: true, animations: 'disabled' });
  });
});