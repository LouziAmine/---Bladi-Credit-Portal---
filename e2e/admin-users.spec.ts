import { test, expect } from '@playwright/test';
import { backendIsUp, AUTH_FILE, SEEDED_MANAGER } from './helpers';

const SHOT = 'docs/screenshots/e2e/admin-users';

test.describe('Admin - user management', () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running on :8080 - start it first (see README).');
    await page.goto('/admin/users');
  });

  test('creates a new CLIENT user, which then appears in the account list', async ({ page }) => {
    const username = `e2e-client-${Date.now()}`;

    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('TestPass1234');
    await page.getByLabel(/rôle/i).selectOption('CLIENT');
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.getByText(`Utilisateur "${username}" créé avec succès.`)).toBeVisible();
    await expect(page.getByRole('cell', { name: username })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/01-create-client-user.png`, fullPage: true, animations: 'disabled' });
  });

  test('rejects a duplicate username with the backend 409 surfaced as a real error', async ({ page }) => {
    await page.getByLabel(/nom d'utilisateur/i).fill(SEEDED_MANAGER.username);
    await page.getByLabel(/mot de passe/i).fill('TestPass1234');
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.locator('.cb-alert--danger')).toBeVisible();
    await expect(page.locator('.cb-alert--danger')).not.toBeEmpty();
    await page.screenshot({ path: `${SHOT}/02-duplicate-username-error.png`, fullPage: true, animations: 'disabled' });
  });

  test('a manager cannot change their own role', async ({ page }) => {
    const ownRow = page.locator('tr', { has: page.getByText('Vous') });
    await expect(ownRow).toBeVisible();
    await expect(ownRow.getByRole('button')).toBeDisabled();
    await page.screenshot({ path: `${SHOT}/03-self-role-change-disabled.png`, fullPage: true, animations: 'disabled' });
  });

  test('promoting then demoting a freshly created user round-trips its role badge', async ({ page }) => {
    const username = `e2e-role-${Date.now()}`;
    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('TestPass1234');
    await page.getByLabel(/rôle/i).selectOption('CLIENT');
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();
    await expect(page.getByText(`Utilisateur "${username}" créé avec succès.`)).toBeVisible();

    const row = page.locator('tr', { has: page.getByRole('cell', { name: username }) });
    await expect(row.getByText('CLIENT')).toBeVisible();

    await row.getByRole('button', { name: /promouvoir en manager/i }).click();
    await expect(row.getByText('MANAGER')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-promote-demote-roundtrip.png`, fullPage: true, animations: 'disabled' });

    await row.getByRole('button', { name: /rétrograder en client/i }).click();
    await expect(row.getByText('CLIENT')).toBeVisible();
  });

  test('creates a new MANAGER user directly, which then appears with the MANAGER badge', async ({ page }) => {
    const username = `e2e-newmgr-${Date.now()}`;

    await page.getByLabel(/nom d'utilisateur/i).fill(username);
    await page.getByLabel(/mot de passe/i).fill('TestPass1234');
    await page.getByLabel(/rôle/i).selectOption('MANAGER');
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.getByText(`Utilisateur "${username}" créé avec succès.`)).toBeVisible();
    const row = page.locator('tr', { has: page.getByRole('cell', { name: username }) });
    await expect(row.getByText('MANAGER', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${SHOT}/05-create-manager-user.png`, fullPage: true, animations: 'disabled' });
  });

  test('username shorter than 3 characters is blocked client-side', async ({ page }) => {
    let createRequestSent = false;
    await page.route('**/api/v1/users', (route) => {
      if (route.request().method() === 'POST') createRequestSent = true;
      return route.continue();
    });

    await page.getByLabel(/nom d'utilisateur/i).fill('ab');
    await page.getByLabel(/nom d'utilisateur/i).blur();
    await page.getByLabel(/mot de passe/i).fill('TestPass1234');
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.getByText('Minimum 3 caractères.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/06-username-min-length-validation.png`, fullPage: true, animations: 'disabled' });
    expect(createRequestSent).toBe(false);
  });

  test('password shorter than 12 characters is blocked client-side', async ({ page }) => {
    let createRequestSent = false;
    await page.route('**/api/v1/users', (route) => {
      if (route.request().method() === 'POST') createRequestSent = true;
      return route.continue();
    });

    await page.getByLabel(/nom d'utilisateur/i).fill(`e2e-shortpw-${Date.now()}`);
    await page.getByLabel(/mot de passe/i).fill('Short1');
    await page.getByLabel(/mot de passe/i).blur();
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.getByText('Minimum 12 caractères.')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/07-password-min-length-validation.png`, fullPage: true, animations: 'disabled' });
    expect(createRequestSent).toBe(false);
  });

  test('password missing complexity (no uppercase) is blocked client-side', async ({ page }) => {
    let createRequestSent = false;
    await page.route('**/api/v1/users', (route) => {
      if (route.request().method() === 'POST') createRequestSent = true;
      return route.continue();
    });

    await page.getByLabel(/nom d'utilisateur/i).fill(`e2e-weakpw-${Date.now()}`);
    await page.getByLabel(/mot de passe/i).fill('alllowercase1234');
    await page.getByLabel(/mot de passe/i).blur();
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click();

    await expect(page.getByText(/doit contenir une majuscule/i)).toBeVisible();
    await page.screenshot({ path: `${SHOT}/08-password-complexity-validation.png`, fullPage: true, animations: 'disabled' });
    expect(createRequestSent).toBe(false);
  });
});