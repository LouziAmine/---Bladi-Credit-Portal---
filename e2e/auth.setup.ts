import { test as setup, expect } from '@playwright/test';
import { login, SEEDED_MANAGER, AUTH_FILE, backendIsUp } from './helpers';

setup('authenticate as seeded manager', async ({ page }) => {
  if (await backendIsUp(page)) {
    await login(page, SEEDED_MANAGER.username, SEEDED_MANAGER.password);
    await expect(page).toHaveURL(/\/simulation$/);
  }
  await page.context().storageState({ path: AUTH_FILE });
});