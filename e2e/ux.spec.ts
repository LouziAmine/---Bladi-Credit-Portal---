import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BACKEND_URL, SEEDED_MANAGER, backendIsUp } from './helpers';
import { company, person } from './world';

const SHOT = 'docs/screenshots/e2e/ux';
const ARABIC = /[؀-ۿ]/;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

async function chooseLanguage(page: Page, label: 'Français' | 'English' | 'العربية'): Promise<void> {
  await page.locator('button:has(.bi-translate)').click();
  await page.locator('.dropdown-item', { hasText: label }).click();
}

async function fillMortgage(page: Page, applicant: { fullName: string; email: string; phone: string }, age = '35'): Promise<void> {
  await page.locator('#applicantName').fill(applicant.fullName);
  await page.locator('#email').fill(applicant.email);
  await page.locator('#phone').fill(applicant.phone);
  await page.locator('#cspCode').selectOption('SALA');
  await page.locator('#age').fill(age);
  await page.locator('#propertyValue').fill('600000');
  await page.locator('#monthlyIncome').fill('20000');
}

async function fillInvestment(page: Page, c: ReturnType<typeof company>): Promise<void> {
  await page.locator('#companyName').fill(c.name);
  await page.locator('#enterpriseType').selectOption('PME');
  await page.locator('#email').fill(c.contactEmail);
  await page.locator('#phone').fill(c.contact.phone);
  await page.locator('#companyAgeYears').fill('5');
  await page.locator('#amount').fill('1500000');
  await page.locator('#duration').fill('84');
  await page.locator('#annualRevenue').fill('8000000');
  await page.locator('#netAnnualResult').fill('1200000');
  await page.locator('#existingAnnualDebtService').fill('100000');
  await page.locator('#guaranteesValue').fill('1300000');
}

const simulate = (page: Page) => page.locator('form button[type=submit]').click();

async function logInAsManager(page: Page): Promise<void> {
  const res = await page.context().request.post(`${BACKEND_URL}/api/v1/auth/login`, { data: SEEDED_MANAGER });
  expect(res.ok(), `manager login -> ${res.status()}`).toBeTruthy();
}

async function dossierReference(page: Page): Promise<string> {
  const alert = page.locator('.cb-alert--success');
  await expect(alert).toContainText(/DEM-[0-9A-F]+/);
  return (/DEM-[0-9A-F]+/.exec((await alert.textContent()) ?? '') ?? [''])[0];
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page scrolls horizontally').toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
});

test.describe('Languages: French, English, Arabic (RTL)', () => {
  test('switching language translates the page, Arabic flips it right-to-left, and the choice survives a reload', async ({ page }) => {
    await page.goto('/mortgage-credit');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Simulateur de crédit immobilier');

    await chooseLanguage(page, 'English');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mortgage loan simulator');
    await expect(page.getByRole('link', { name: /mortgage credit/i }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await chooseLanguage(page, 'العربية');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('محاكي القرض العقاري');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await page.screenshot({ path: `${SHOT}/01-arabic-rtl.png`, fullPage: true, animations: 'disabled' });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('محاكي القرض العقاري');

    await chooseLanguage(page, 'Français');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Simulateur de crédit immobilier');
  });

  test('a refused simulation explains the reason in the language the visitor chose', async ({ page }) => {
    await page.goto('/mortgage-credit');
    await chooseLanguage(page, 'العربية');
    await fillMortgage(page, person('gmail.com'), '70');
    await simulate(page);
    await expect(page.locator('.cb-alert--danger')).toContainText(ARABIC);
    await page.screenshot({ path: `${SHOT}/02-arabic-rejection.png`, fullPage: true, animations: 'disabled' });

    await chooseLanguage(page, 'English');
    await simulate(page);
    await expect(page.locator('.cb-alert--danger')).toContainText(/age/i);
    await expect(page.locator('.cb-alert--danger')).not.toContainText(ARABIC);
    await chooseLanguage(page, 'Français');
  });
});

test.describe('Simulating again before anyone handles the dossier', () => {
  test('the same applicant simulating a mortgage twice keeps a single dossier reference', async ({ page }) => {
    const applicant = person('gmail.com');
    await page.goto('/mortgage-credit');
    await fillMortgage(page, applicant);
    await simulate(page);
    const first = await dossierReference(page);

    await page.locator('#propertyValue').fill('650000');
    await simulate(page);
    await expect(page.locator('.cb-alert--success')).toContainText(first);
    await page.screenshot({ path: `${SHOT}/03-mortgage-same-dossier.png`, fullPage: true, animations: 'disabled' });
  });

  test('the same company simulating an investment credit twice keeps a single dossier reference', async ({ page }) => {
    const c = company();
    await page.goto('/investment-credit');
    await fillInvestment(page, c);
    await simulate(page);
    const first = await dossierReference(page);

    await page.locator('#duration').fill('72');
    await simulate(page);
    await expect(page.locator('.cb-alert--success')).toContainText(first);
  });
});

test.describe('Phone-sized screens', () => {
  test.use(PHONE);

  for (const path of ['/mortgage-credit', '/investment-credit', '/login', '/register']) {
    test(`${path} fits the screen width without horizontal scrolling`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main, app-root').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalScroll(page);
    });
  }

  test('the navigation collapses behind a labelled menu button that opens and closes it', async ({ page }) => {
    await page.goto('/mortgage-credit');
    const toggler = page.getByRole('button', { name: 'Ouvrir ou fermer le menu' });
    const investmentLink = page.getByRole('link', { name: /crédit d'investissement/i });
    await expect(toggler).toBeVisible();
    await expect(investmentLink).toBeHidden();

    await toggler.click();
    await expect(toggler).toHaveAttribute('aria-expanded', 'true');
    await expect(investmentLink).toBeVisible();
    await page.screenshot({ path: `${SHOT}/04-mobile-menu-open.png`, animations: 'disabled' });

    await investmentLink.click();
    await expect(page).toHaveURL(/\/investment-credit$/);
  });

  test('a mortgage simulation can be completed end to end on a phone', async ({ page }) => {
    await page.goto('/mortgage-credit');
    await fillMortgage(page, person('gmail.com'));
    await simulate(page);
    await expect(page.getByText('Paramètres BAM appliqués')).toBeVisible();
    await expect(page.locator('.cb-alert--success')).toContainText(/DEM-[0-9A-F]+/);
    await expectNoHorizontalScroll(page);
    await page.screenshot({ path: `${SHOT}/05-mobile-simulation.png`, fullPage: true, animations: 'disabled' });
  });

  test.describe('back office', () => {
    test.beforeEach(async ({ page }) => logInAsManager(page));

    for (const path of ['/admin/demands', '/admin/users', '/admin/audit-log']) {
      test(`${path} keeps wide tables scrollable inside their card, not the whole page`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('table').first()).toBeVisible();
        await expectNoHorizontalScroll(page);
      });
    }
  });
});

test.describe('Keyboard-only use', () => {
  test('a user can log in with the keyboard alone (Tab between fields, Enter to submit)', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/nom d'utilisateur/i).focus();
    await page.keyboard.type(SEEDED_MANAGER.username);
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/mot de passe/i)).toBeFocused();
    await page.keyboard.type(SEEDED_MANAGER.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/mortgage-credit$/);
  });

  test('the simulator can be filled and submitted without a mouse', async ({ page }) => {
    await page.goto('/mortgage-credit');
    await fillMortgage(page, person('gmail.com'));
    await page.locator('#monthlyIncome').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Paramètres BAM appliqués')).toBeVisible();
  });
});

test.describe('Accessibility (axe, WCAG 2.1 A/AA)', () => {
  test.use({ reducedMotion: 'reduce' });

  async function audit(page: Page): Promise<void> {
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity));
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const where = (n: (typeof violations)[number]['nodes'][number]): string => {
      const data = n.any[0]?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number } | undefined;
      return n.target.join(' ') + (data?.fgColor ? ` ${data.fgColor} on ${data.bgColor} = ${data.contrastRatio}:1` : '');
    };
    const summary = violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.slice(0, 3).map(where).join(' | ')})`);
    expect(summary, summary.join('\n')).toEqual([]);
  }

  for (const path of ['/mortgage-credit', '/investment-credit', '/login', '/register']) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await audit(page);
    });
  }

  test('a simulation result (offer and dossier reference) has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/mortgage-credit');
    await fillMortgage(page, person('gmail.com'));
    await simulate(page);
    await expect(page.getByText('Paramètres BAM appliqués')).toBeVisible();
    await audit(page);
  });

  test.describe('back office', () => {
    test.beforeEach(async ({ page }) => logInAsManager(page));

    for (const path of ['/admin/demands', '/admin/users', '/admin/enterprises', '/admin/bam-parameters', '/admin/audit-log']) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('table, form').first()).toBeVisible();
        await audit(page);
      });
    }

    test('a dossier detail (summary, pipeline, documents, history) has no WCAG A/AA violations', async ({ page }) => {
      await page.goto('/admin/demands');
      await page.locator('a[href^="/admin/demands/"]:not([href$="/import"])').first().click();
      await expect(page.locator('app-demand-pipeline')).toBeVisible();
      await audit(page);
    });
  });
});
