import { test, expect, Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test';
import { backendIsUp } from './helpers';
import {
  RIB_BAD_KEY, RIB_VALID, STAFF_PASSWORD, Staff, adminApi, advanceUntil, browserAs, createEnterprise, currentStep,
  findDemand, infectedDocx, pdfFile, pipeline, simulateInvestment, completeDemand, company,
} from './world';

const SHOT = 'docs/screenshots/e2e/demand-workflow';

test.describe.serial('Back office - investment dossier workflow', () => {
  let admin: APIRequestContext;
  let staff: Staff;
  let demandId: string;
  let reference: string;
  let companyName: string;
  let enterpriseName: string;
  let ice: string;

  const contexts: BrowserContext[] = [];

  async function actor(browser: Browser, username: string): Promise<Page> {
    const context = await browserAs(browser, username, STAFF_PASSWORD);
    contexts.push(context);
    return context.newPage();
  }

  test.afterEach(async () => {
    await Promise.all(contexts.splice(0).map((c) => c.close()));
  });

  async function openDossier(page: Page): Promise<void> {
    await page.goto(`/admin/demands/${demandId}`);
    await expect(page.getByText(reference).first()).toBeVisible();
    await expect(page.locator('app-demand-pipeline')).toBeVisible();
  }

  async function step(): Promise<string> {
    return (await currentStep(admin, demandId)).stepCode;
  }

  async function openAdvanceForm(page: Page): Promise<void> {
    await page.getByRole('button', { name: /avancer \/ retourner le dossier/i }).click();
    await page.locator('label[for=rateOptionKEEP]').click();
    await page.locator('label[for=amountOptionKEEP]').click();
    await page.locator('label[for=durationOptionKEEP]').click();
  }

  async function nextAssignee(): Promise<string> {
    const steps = await pipeline(admin, demandId);
    const current = await currentStep(admin, demandId);
    const i = steps.findIndex((s) => s.stepCode === current.stepCode);
    return staff.forStep(steps[i + 1]);
  }

  test.beforeAll(async () => {
    admin = await adminApi();
    staff = await Staff.create(admin);
    const c = company();
    companyName = c.name;
    ice = c.ice;
    enterpriseName = companyName;
    ({ reference } = await simulateInvestment({ companyName, sector: c.sector, email: c.contactEmail, phone: c.contact.phone }));
    demandId = (await findDemand(admin, reference)).id;
    await createEnterprise(admin, enterpriseName, c.registrationNumber, c.sector);
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!(await backendIsUp(page)), 'Backend API not running - start it first (see README).');
  });

  test('the new dossier appears in the back-office list and can be found by company, status and amount', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'));
    await page.goto('/admin/demands');
    await page.locator('#demandCompanyName').fill(companyName);
    await page.locator('#demandStatus').selectOption({ index: 1 });
    await page.locator('#demandMinAmount').fill('1000000');
    const row = page.locator('tr', { hasText: reference });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Validation initiale du dossier avec le client');
    await page.screenshot({ path: `${SHOT}/01-demands-list-filtered.png`, fullPage: true, animations: 'disabled' });
    await row.getByRole('link').first().click();
    await expect(page).toHaveURL((url) => url.pathname === `/admin/demands/${demandId}`);
    await expect(page.locator('app-demand-pipeline')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/02-dossier-at-classification.png`, fullPage: true, animations: 'disabled' });
  });

  test('BAM / SCIP / Centrale des Risques check from the classification step', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'));
    await openDossier(page);
    await page.locator('#bamIdentifiant').fill(ice);
    await page.locator('#bamScenario').selectOption('PERSONAL_EXPOSURE_DETECTED');
    await page.locator('app-bam-verification-panel form button[type=submit]').click();
    const panel = page.locator('app-bam-verification-panel');
    await expect(panel).toContainText('Encours détecté');
    await expect(panel).toContainText('À jour');
    await expect(panel).not.toContainText('bamVerification.');
    await page.locator('app-bam-verification-panel').screenshot({ path: `${SHOT}/03-bam-verification.png`, animations: 'disabled' });
  });

  test('an actor without the step profile cannot classify the dossier', async ({ browser }) => {
    const page = await actor(browser, staff.for('ANALYSTE', 'PAE'));
    await openDossier(page);
    await page.getByRole('button', { name: /classifier le dossier/i }).first().click();
    await page.locator('label[for=classificationOutcomeFAKE]').click();
    await page.locator('app-demand-classification button[type=submit]').click();
    await expect(page.locator('app-demand-classification .cb-alert--danger')).toBeVisible();
    expect(await step()).toBe('CLASSIFICATION_STEP');
  });

  test('classify REAL: an invalid client RIB is refused, a valid one moves the dossier to Initiation', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU'));
    await openDossier(page);
    await page.getByRole('button', { name: /classifier le dossier/i }).first().click();
    await page.locator('label[for=classificationOutcomeREAL]').click();
    await page.getByRole('button', { name: /utiliser cette entreprise/i }).click();
    await page.locator('#classifyAssigneeUsername').selectOption(staff.for('CHARGE_AFFAIRES', 'RESEAU', 1));
    await page.locator('#classifyClientRib').fill(RIB_BAD_KEY);
    await page.locator('#classifyNote').fill('Client joint par téléphone, dossier authentique.');
    await page.screenshot({ path: `${SHOT}/04-classification-form.png`, fullPage: true, animations: 'disabled' });
    await page.locator('app-demand-classification button[type=submit]').click();
    await expect(page.locator('app-demand-classification .cb-alert--danger')).toBeVisible();
    await page.screenshot({ path: `${SHOT}/05-classification-invalid-rib.png`, fullPage: true, animations: 'disabled' });
    expect(await step()).toBe('CLASSIFICATION_STEP');

    await page.locator('#classifyClientRib').fill(RIB_VALID);
    await page.locator('app-demand-classification button[type=submit]').click();
    await expect.poll(step).toBe('INITIATION_STEP');
    const demand = await (await admin.get(`/api/v1/demands/${demandId}`)).json();
    expect(demand.enterprise.enterpriseId, 'the enterprise must stay attached to the dossier').toBeTruthy();
    await page.reload();
    await expect(page.getByText('Initiation du dossier').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/06-classified-real.png`, fullPage: true, animations: 'disabled' });
  });

  test('reassign the step to a colleague of the same profile, then add a remark', async ({ browser }) => {
    const owner = staff.for('CHARGE_AFFAIRES', 'RESEAU', 1);
    const colleague = staff.for('CHARGE_AFFAIRES', 'RESEAU', 0);
    const page = await actor(browser, owner);
    await openDossier(page);
    await page.getByRole('button', { name: /affecter \/ réaffecter/i }).click();
    await page.locator('#assignUsername').selectOption(colleague);
    await page.getByRole('button', { name: /(^|\s)affecter$/i }).click();
    await expect.poll(async () => (await currentStep(admin, demandId)).assignedUsername).toBe(colleague);
    await page.screenshot({ path: `${SHOT}/07-reassigned.png`, fullPage: true, animations: 'disabled' });

    await page.getByRole('button', { name: /ajouter une remarque/i }).click();
    await page.locator('#comment').fill('Pièces d\'identité des associés à récupérer.');
    await page.getByRole('button', { name: /ajouter la remarque/i }).click();
    await expect(page.locator('app-demand-comments')).toContainText('Pièces d\'identité des associés');
    await page.locator('app-demand-comments').screenshot({ path: `${SHOT}/08-remark-added.png`, animations: 'disabled' });
  });

  test('documents: a real PDF is scanned clean; a disguised or infected file is refused; same type supersedes', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU', 0));
    await openDossier(page);
    const upload = page.locator('app-document-upload');

    await page.locator('#documentFile').setInputFiles({ name: 'statuts.pdf', mimeType: 'application/pdf', buffer: pdfFile('Statuts') });
    await page.locator('#documentType').fill('Statuts');
    await upload.locator('form button[type=submit]').click();
    await expect(upload.locator('tr', { hasText: 'statuts.pdf' })).toContainText('Sain');

    await page.locator('#documentFile').setInputFiles({ name: 'faux.pdf', mimeType: 'application/pdf', buffer: Buffer.from('juste du texte') });
    await upload.locator('form button[type=submit]').click();
    await expect(upload.locator('.cb-alert--danger')).toBeVisible();
    await upload.screenshot({ path: `${SHOT}/09-document-type-refused.png`, animations: 'disabled' });

    await page.locator('#documentFile').setInputFiles({ name: 'infecte.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: infectedDocx() });
    await upload.locator('form button[type=submit]').click();
    await expect(upload.locator('.cb-alert--danger')).toBeVisible();
    await upload.screenshot({ path: `${SHOT}/10-document-infected-refused.png`, animations: 'disabled' });

    await page.locator('#documentFile').setInputFiles({ name: 'statuts-v2.pdf', mimeType: 'application/pdf', buffer: pdfFile('Statuts v2') });
    await page.locator('#documentType').fill('Statuts');
    await upload.locator('form button[type=submit]').click();
    await expect(upload.locator('tr', { hasText: 'statuts-v2.pdf' })).toContainText('Actif');
    await expect(upload.locator('tr', { hasText: 'statuts.pdf' }).filter({ hasNotText: 'v2' })).toContainText('Remplacé');
    await upload.screenshot({ path: `${SHOT}/11-documents-versioned.png`, animations: 'disabled' });

    await upload.locator('tr', { hasText: 'statuts-v2.pdf' }).getByRole('button').first().click();
    await expect(page.locator('app-document-viewer-overlay iframe, app-document-viewer-overlay object, app-document-viewer-overlay embed').first()).toBeVisible();
    await page.screenshot({ path: `${SHOT}/12-document-viewer.png`, animations: 'disabled' });
  });

  test('ask the client for a document', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU', 0));
    await openDossier(page);
    const requests = page.locator('app-document-request-list');
    await page.locator('#requestDocumentType').fill('Bilan 2025 certifié');
    await requests.locator('form button[type=submit]').click();
    await expect(requests.locator('tr', { hasText: 'Bilan 2025 certifié' })).toContainText('En attente');
    await requests.screenshot({ path: `${SHOT}/13-document-requested.png`, animations: 'disabled' });
  });

  test('another profile cannot advance a step that is not theirs: the form is locked', async ({ browser }) => {
    const page = await actor(browser, staff.for('ANALYSTE', 'PAE'));
    await openDossier(page);
    await openAdvanceForm(page);
    await expect(page.locator('.cb-alert--amber', { hasText: /affectée à/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /avancer le dossier$/i })).toBeDisabled();
    await page.screenshot({ path: `${SHOT}/14-advance-locked-for-others.png`, fullPage: true, animations: 'disabled' });
    expect(await step()).toBe('INITIATION_STEP');
  });

  test('advance Initiation -> Instruction, then the next step returns the dossier for completion', async ({ browser }) => {
    const initiator = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU', 0));
    await openDossier(initiator);
    await openAdvanceForm(initiator);
    await initiator.locator('#assigneeUsername').selectOption(await nextAssignee());
    await initiator.locator('#note').fill('Dossier complet, transmis à la plateforme PPIF.');
    await initiator.screenshot({ path: `${SHOT}/15-advance-form.png`, fullPage: true, animations: 'disabled' });
    await initiator.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect.poll(step).toBe('INSTRUCTION_TS_STEP');

    const ts = await actor(browser, (await currentStep(admin, demandId)).assignedUsername!);
    await openDossier(ts);
    await openAdvanceForm(ts);
    await ts.locator('#assigneeUsername').selectOption(await nextAssignee());
    await ts.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect.poll(step).toBe('INSTRUCTION_MONTAGE_STEP');

    const montage = await actor(browser, (await currentStep(admin, demandId)).assignedUsername!);
    await openDossier(montage);
    await openAdvanceForm(montage);
    await montage.locator('#returnReasonCode').fill('PIECE_MANQUANTE');
    await montage.locator('#assigneeUsername').selectOption(staff.for('CHARGE_INVESTISSEMENT', 'PPIF_PME', 1));
    await montage.getByRole('button', { name: /^\W*retourner le dossier$/i }).click();
    await expect.poll(step).toBe('INSTRUCTION_TS_STEP');
    await montage.reload();
    await expect(montage.locator('app-demand-history')).toContainText('PIECE_MANQUANTE');
    await montage.screenshot({ path: `${SHOT}/16-returned-for-completion.png`, fullPage: true, animations: 'disabled' });
  });

  test('committee decision: deferred without a return and a rate above the TMIC are refused', async ({ browser }) => {
    await advanceUntil(staff, demandId, 'DECISION_STEP');
    const decider = await actor(browser, (await currentStep(admin, demandId)).assignedUsername!);
    await openDossier(decider);
    await openAdvanceForm(decider);
    await decider.locator('#assigneeUsername').selectOption(await nextAssignee());

    await decider.locator('#decisionOutcome').selectOption('DEFERRED');
    await decider.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect(decider.locator('.cb-alert--danger').first()).toBeVisible();
    await decider.screenshot({ path: `${SHOT}/17-decision-deferred-refused.png`, fullPage: true, animations: 'disabled' });

    await decider.locator('#decisionOutcome').selectOption('APPROVED');
    await decider.locator('label[for=rateOptionMANUAL]').click();
    await decider.locator('#manualRate').fill('15.5');
    await decider.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect(decider.locator('.cb-alert--danger').first()).toBeVisible();
    await decider.screenshot({ path: `${SHOT}/18-decision-rate-above-tmic.png`, fullPage: true, animations: 'disabled' });
    expect(await step()).toBe('DECISION_STEP');
  });

  test('committee grants the credit at a negotiated rate, frozen on the dossier', async ({ browser }) => {
    const decider = await actor(browser, (await currentStep(admin, demandId)).assignedUsername!);
    await openDossier(decider);
    await openAdvanceForm(decider);
    await decider.locator('#assigneeUsername').selectOption(await nextAssignee());
    await decider.locator('#decisionOutcome').selectOption('APPROVED');
    await decider.locator('label[for=rateOptionMANUAL]').click();
    await decider.locator('#manualRate').fill('6.25');
    await decider.locator('#recommendations').fill('Suivi trimestriel des indicateurs financiers.');
    await decider.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect.poll(step).toBe('CONTRACT_EDITION_STEP');
    const demand = await (await admin.get(`/api/v1/demands/${demandId}`)).json();
    expect(Number(demand.applicableRate)).toBe(6.25);
    await decider.reload();
    await decider.screenshot({ path: `${SHOT}/19-credit-granted.png`, fullPage: true, animations: 'disabled' });
  });

  test('insurance step: the ADI subscription must be confirmed before moving on', async ({ browser }) => {
    await advanceUntil(staff, demandId, 'INSURANCE_VALIDATION_STEP');
    const manager = await actor(browser, (await currentStep(admin, demandId)).assignedUsername!);
    await openDossier(manager);
    await openAdvanceForm(manager);
    await manager.locator('#assigneeUsername').selectOption(await nextAssignee());
    await expect(manager.getByRole('button', { name: /avancer le dossier$/i })).toBeDisabled();
    await manager.screenshot({ path: `${SHOT}/20-insurance-missing.png`, fullPage: true, animations: 'disabled' });

    await manager.locator('#insuranceAdiSubscribed').check();
    await manager.locator('#insuranceCoverageType').selectOption('BANK_GROUP_POLICY');
    const damage = manager.locator('#insuranceDamageSubscribed');
    if (await damage.count()) await damage.check();
    await manager.getByRole('button', { name: /avancer le dossier$/i }).click();
    await expect.poll(step).toBe('GUARANTEES_NOTIF_STEP');
  });

  test('last step passed: the dossier is completed and its credit file opens with the full schedule', async ({ browser }) => {
    await completeDemand(staff, demandId);
    const page = await actor(browser, staff.for('GESTIONNAIRE', 'OGS_MEG'));
    await openDossier(page);
    const creditFile = page.locator('app-demand-credit-file');
    await expect(creditFile).toBeVisible();
    await creditFile.getByRole('button', { name: /échéancier/i }).click();
    await expect(creditFile.locator('tbody tr')).toHaveCount(84);
    await page.screenshot({ path: `${SHOT}/21-completed-credit-file.png`, fullPage: true, animations: 'disabled' });
    await expect(page.getByRole('button', { name: /avancer \/ retourner le dossier/i })).toHaveCount(0);
  });

  test('the manager bell lists the assignments received', async ({ browser }) => {
    const page = await actor(browser, staff.for('CHARGE_AFFAIRES', 'RESEAU', 0));
    await page.goto('/admin/demands');
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.locator('.cb-notification-menu')).toContainText(reference);
    await page.screenshot({ path: `${SHOT}/22-notifications.png`, animations: 'disabled' });
  });
});
