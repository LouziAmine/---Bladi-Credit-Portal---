import { Page } from '@playwright/test';

export const SEEDED_MANAGER = { username: 'admin', password: 'admin123' };

export const AUTH_FILE = 'e2e/.auth/manager.json';

export const BACKEND_URL = process.env['E2E_BACKEND_URL'] ?? 'http://localhost:8080';

export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/nom d'utilisateur/i).fill(username);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

export async function backendIsUp(page: Page): Promise<boolean> {
  try {
    const res = await page.request.get(`${BACKEND_URL}/actuator/health`).catch(() => null);
    return res !== null && res.ok();
  } catch {
    return false;
  }
}