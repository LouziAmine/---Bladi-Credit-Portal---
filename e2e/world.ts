import { APIRequestContext, Browser, BrowserContext, expect, request } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import { BACKEND_URL, SEEDED_MANAGER } from './helpers';
import { Company, Person, company, person } from './morocco';

export { company, person };
export type { Company, Person };

export const STAFF_PASSWORD = 'E2e!Passw0rd2026';
export const CLIENT_PASSWORD = 'Client!Passw0rd2026';
const MAILPIT_URL = process.env['E2E_MAILPIT_URL'] ?? 'http://localhost:8025';
export const RIB_VALID = '230 780 0123456789012345 03';
export const RIB_OTHER = '230 780 0000000000000000 39';
export const RIB_BAD_KEY = '230 780 0123456789012345 95';

export const uid = (): string => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

interface Demand {
  id: string;
  reference: string;
  completed: boolean;
  rejected: boolean;
  applicableRate: number | null;
}

interface Step {
  stepCode: string;
  stepName: string;
  requiredGradeCode: string | null;
  requiredTeamCode: string | null;
  assignedUsername: string | null;
}

export async function apiAs(username: string, password: string): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: BACKEND_URL, extraHTTPHeaders: { 'Accept-Language': 'fr' } });
  const res = await ctx.post('/api/v1/auth/login', { data: { username, password } });
  expect(res.ok(), `login ${username} -> ${res.status()}`).toBeTruthy();
  return ctx;
}

export const adminApi = (): Promise<APIRequestContext> => apiAs(SEEDED_MANAGER.username, SEEDED_MANAGER.password);

export async function publicApi(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: BACKEND_URL, extraHTTPHeaders: { 'Accept-Language': 'fr' } });
}

export async function browserAs(browser: Browser, username: string, password: string): Promise<BrowserContext> {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const res = await context.request.post(`${BACKEND_URL}/api/v1/auth/login`, { data: { username, password } });
  expect(res.ok(), `browser login ${username} -> ${res.status()}`).toBeTruthy();
  return context;
}

async function json<T>(res: import('@playwright/test').APIResponse, what: string): Promise<T> {
  expect(res.ok(), `${what} -> ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()) as T;
}

export async function findDemand(api: APIRequestContext, reference: string): Promise<Demand> {
  for (let page = 1; page < 50; page++) {
    const data = await json<{ items: Demand[]; lastPage: number }>(
      await api.get('/api/v1/demands', { params: { page, size: 50 } }), 'list demands');
    const found = data.items.find((d) => d.reference === reference);
    if (found) return found;
    if (page >= data.lastPage) break;
  }
  throw new Error(`demand ${reference} not found`);
}

export async function pipeline(api: APIRequestContext, demandId: string): Promise<Step[]> {
  return json<Step[]>(await api.get(`/api/v1/demands/${demandId}/pipeline`), 'pipeline');
}

export async function currentStep(api: APIRequestContext, demandId: string): Promise<Step> {
  return json<Step>(await api.get(`/api/v1/demands/${demandId}/current-step`), 'current step');
}

export class Staff {
  private readonly byPair = new Map<string, string[]>();

  static async create(admin: APIRequestContext): Promise<Staff> {
    const staff = new Staff();
    const pub = await publicApi();
    const probes = [
      await pub.post('/api/v1/investment-credit', { data: investmentBody() }),
      await pub.post('/api/v1/investment-credit', { data: investmentBody({ enterpriseType: 'GE', amount: 3000000, guaranteesValue: 3000000, netAnnualResult: 3000000 }) }),
      await pub.post('/api/v1/mortgage-credit', { data: mortgageBody() }),
    ];
    const pairs = new Set<string>(['ANY|ANY']);
    for (const probe of probes) {
      const { demandReference } = await json<{ demandReference: string }>(probe, 'probe simulation');
      const demand = await findDemand(admin, demandReference);
      for (const step of await pipeline(admin, demand.id)) {
        pairs.add(`${step.requiredGradeCode ?? 'ANY'}|${step.requiredTeamCode ?? 'ANY'}`);
      }
    }
    for (const pair of pairs) {
      const [grade, team] = pair.split('|');
      const users: string[] = [];
      for (let i = 0; i < 2; i++) {
        const who = person();
        const data: Record<string, string> = { fullName: who.fullName, password: STAFF_PASSWORD, role: 'MANAGER' };
        if (grade !== 'ANY') data['gradeCode'] = grade;
        if (team !== 'ANY') data['teamCode'] = team;
        users.push(await createUnique(admin, '/api/v1/users', who, (username) => ({ ...data, username, email: `${username}@bladi-credit.ma` })));
      }
      staff.byPair.set(pair, users);
    }
    await pub.dispose();
    return staff;
  }

  for(grade: string | null, team: string | null, index = 0): string {
    const users = this.byPair.get(`${grade ?? 'ANY'}|${team ?? 'ANY'}`);
    if (!users) throw new Error(`no staff for ${grade}/${team}`);
    return users[index];
  }

  forStep(step: Pick<Step, 'requiredGradeCode' | 'requiredTeamCode'>, index = 0): string {
    return this.for(step.requiredGradeCode, step.requiredTeamCode, index);
  }
}

function mortgageBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  const applicant = person('gmail.com');
  return {
    applicantName: applicant.fullName, email: applicant.email, phone: applicant.phone, amount: 500000,
    duration: 240, cspCode: 'SALA', nationalityCode: 'MA', moroccanResident: true, propertyValue: 600000,
    monthlyIncome: 20000, age: 35, ...over,
  };
}

function investmentBody(over: Record<string, unknown> = {}): Record<string, unknown> {
  const c = company();
  return {
    companyName: c.name, enterpriseType: 'PME', sector: c.sector, email: c.contactEmail, phone: c.contact.phone,
    amount: 1500000, duration: 84, annualRevenue: 8000000, companyAgeYears: 5, existingAnnualDebtService: 100000,
    netAnnualResult: 1200000, guaranteesValue: 1300000, ...over,
  };
}

async function createUnique(api: APIRequestContext, path: string, who: Person,
    body: (username: string) => Record<string, unknown>): Promise<string> {
  for (let n = 1; n < 20; n++) {
    const username = n === 1 ? who.username : `${who.username}${n}`;
    const res = await api.post(path, { data: body(username) });
    if (res.ok()) return username;
    expect(res.status(), `create ${username}: ${await res.text()}`).toBe(409);
  }
  throw new Error(`no free username for ${who.username}`);
}

export async function simulateInvestment(over: Record<string, unknown> = {}): Promise<{ reference: string; body: Record<string, unknown> }> {
  const pub = await publicApi();
  const body = investmentBody(over);
  const { demandReference } = await json<{ demandReference: string }>(
    await pub.post('/api/v1/investment-credit', { data: body }), 'investment simulation');
  await pub.dispose();
  return { reference: demandReference, body };
}

export async function simulateMortgage(over: Record<string, unknown> = {}): Promise<{ reference: string; body: Record<string, unknown> }> {
  const pub = await publicApi();
  const body = mortgageBody(over);
  const { demandReference } = await json<{ demandReference: string }>(
    await pub.post('/api/v1/mortgage-credit', { data: body }), 'mortgage simulation');
  await pub.dispose();
  return { reference: demandReference, body };
}

export async function createEnterprise(admin: APIRequestContext, name: string, registrationNumber?: string, sector = 'Textile'): Promise<{ id: string; name: string }> {
  return json(await admin.post('/api/v1/enterprises', { data: { name, sector, registrationNumber } }), 'create enterprise');
}

async function advanceApi(staff: Staff, demandId: string, extra: Record<string, unknown> = {}): Promise<void> {
  const admin = await adminApi();
  const steps = await pipeline(admin, demandId);
  const current = await currentStep(admin, demandId);
  const index = steps.findIndex((s) => s.stepCode === current.stepCode);
  const next = steps[index + 1];
  const actor = await apiAs(current.assignedUsername ?? staff.forStep(current), STAFF_PASSWORD);
  const res = await actor.post(`/api/v1/demands/${demandId}/advance`, {
    data: {
      note: 'e2e', rateOption: 'KEEP', amountOption: 'KEEP', durationOption: 'KEEP',
      assigneeUsername: next ? staff.forStep(next) : undefined, ...extra,
    },
  });
  expect(res.ok(), `advance ${current.stepCode}: ${res.status()} ${await res.text()}`).toBeTruthy();
  await actor.dispose();
  await admin.dispose();
}

export async function advanceUntil(staff: Staff, demandId: string, stepCode: string): Promise<void> {
  const admin = await adminApi();
  for (let i = 0; i < 20; i++) {
    const step = await currentStep(admin, demandId);
    if (step.stepCode === stepCode) break;
    const extra: Record<string, unknown> = {};
    if (step.stepCode.includes('DECISION')) extra['decisionOutcome'] = 'APPROVED';
    if (step.stepCode === 'RISK_COMMITTEE_PROG_STEP') extra['committeeType'] = 'ROTATING';
    if (step.stepCode === 'INSURANCE_VALIDATION_STEP') {
      Object.assign(extra, { insuranceAdiSubscribed: true, insuranceCoverageType: 'BANK_GROUP_POLICY', insuranceDamageSubscribed: true });
    }
    await advanceApi(staff, demandId, extra);
  }
  expect((await currentStep(admin, demandId)).stepCode).toBe(stepCode);
  await admin.dispose();
}

export async function completeDemand(staff: Staff, demandId: string): Promise<void> {
  const admin = await adminApi();
  for (let i = 0; i < 20; i++) {
    const demand = await json<Demand>(await admin.get(`/api/v1/demands/${demandId}`), 'demand');
    if (demand.completed) break;
    const step = await currentStep(admin, demandId);
    const extra: Record<string, unknown> = {};
    if (step.stepCode.includes('DECISION')) extra['decisionOutcome'] = 'APPROVED';
    if (step.stepCode === 'INSURANCE_VALIDATION_STEP') {
      Object.assign(extra, { insuranceAdiSubscribed: true, insuranceCoverageType: 'BANK_GROUP_POLICY', insuranceDamageSubscribed: true });
    }
    await advanceApi(staff, demandId, extra);
  }
  await admin.dispose();
}

export async function classifyApi(staff: Staff, demandId: string, enterpriseId?: string, clientRib?: string): Promise<void> {
  const admin = await adminApi();
  const steps = await pipeline(admin, demandId);
  const actor = await apiAs(staff.forStep(steps[0]), STAFF_PASSWORD);
  const res = await actor.post(`/api/v1/demands/${demandId}/classify`, {
    data: { classificationOutcome: 'REAL', enterpriseId, clientRib, assigneeUsername: staff.forStep(steps[1]), note: 'e2e' },
  });
  expect(res.ok(), `classify: ${res.status()} ${await res.text()}`).toBeTruthy();
  await actor.dispose();
  await admin.dispose();
}

export async function registerClient(who: Person = person('gmail.com')): Promise<string> {
  const pub = await publicApi();
  const username = await createUnique(pub, '/api/v1/auth/register', who, (u) => ({ username: u, password: CLIENT_PASSWORD }));
  await pub.dispose();
  return username;
}

export async function mailMatch(to: string, pattern: RegExp | string, timeoutMs = 20000): Promise<string> {
  const ctx = await request.newContext({ baseURL: MAILPIT_URL });
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      const search = await (await ctx.get('/api/v1/search', { params: { query: `to:${to}` } })).json();
      for (const message of search.messages ?? []) {
        const full = await (await ctx.get(`/api/v1/message/${message.ID}`)).json();
        const body = `${full.Text ?? ''}\n${full.HTML ?? ''}`;
        if (typeof pattern === 'string') {
          if (body.includes(pattern)) return pattern;
          continue;
        }
        const found = body.match(pattern);
        if (found) return found[1] ?? found[0];
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  } finally {
    await ctx.dispose();
  }
  throw new Error(`no mail to ${to} matching ${pattern}`);
}

export function pdfFile(text = 'Credit Bladi E2E'): Buffer {
  const content = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, '0')} 00000 n \n`));
  out += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

export function infectedDocx(): Buffer {
  return Buffer.from(zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>E2E</w:t></w:r></w:p></w:body></w:document>'),
    'eicar.com': strToU8(EICAR),
  }));
}

export function xlsxFile(rows: (string | number | null)[][]): Buffer {
  const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const col = (i: number): string => String.fromCharCode(65 + i);
  const sheetRows = rows.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => {
    if (v === null || v === '') return '';
    const ref = `${col(c)}${r + 1}`;
    return typeof v === 'number' ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
  }).join('')}</row>`).join('');
  return Buffer.from(zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Demandes" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`),
  }));
}

export async function freeUsername(who: Person = person()): Promise<string> {
  const admin = await adminApi();
  const taken = new Set<string>();
  for (let page = 1; page < 100; page++) {
    const data = await json<{ items: { username: string }[]; lastPage: number }>(
      await admin.get('/api/v1/users', { params: { page, size: 50 } }), 'list users');
    data.items.forEach((u) => taken.add(u.username));
    if (page >= data.lastPage) break;
  }
  await admin.dispose();
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? who.username : `${who.username}${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
