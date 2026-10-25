import * as XLSX from 'xlsx';
import { unprocessable, notFound } from '../core/demo-result';
import { createDemand } from './workflow-engine';
import { EnterpriseType } from '../core/entities';

const MAX_FILE_SIZE_BYTES = 15728640;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ENTERPRISE_TYPES = new Set(['TPE', 'AUTO_ENTREPRENEUR', 'PME', 'ETI', 'GE']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface ImportRowError {
  rowNumber: number;
  companyName: string | null;
  errorMessage: string;
}
export interface ImportReport {
  jobExecutionId: number;
  status: 'COMPLETED' | 'FAILED';
  readCount: number;
  writeCount: number;
  skipCount: number;
  startTime: string | null;
  endTime: string | null;
  rowErrors: ImportRowError[];
}

const reports = new Map<number, ImportReport>();
let nextJobId = 1;

class RowError extends Error {}

function cell(row: unknown[], i: number): string | null {
  const v = row[i];
  if (v === null || v === undefined || String(v).trim() === '') {
    return null;
  }
  return String(v).trim();
}
function requiredString(row: unknown[], i: number, name: string): string {
  const s = cell(row, i);
  if (!s) {
    throw new RowError(`${name} est obligatoire`);
  }
  return s;
}
function requiredDecimal(row: unknown[], i: number, name: string): number {
  const s = cell(row, i);
  if (!s) {
    throw new RowError(`${name} est obligatoire et doit être numérique`);
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new RowError(`valeur numérique invalide: '${s}'`);
  }
  return n;
}
function optionalDecimal(row: unknown[], i: number): number | null {
  const s = cell(row, i);
  if (!s) {
    return null;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    throw new RowError(`valeur numérique invalide: '${s}'`);
  }
  return n;
}
function requiredInt(row: unknown[], i: number, name: string): number {
  const s = cell(row, i);
  if (!s) {
    throw new RowError(`${name} est obligatoire et doit être un nombre entier`);
  }
  const n = Number(s);
  if (!Number.isInteger(n)) {
    throw new RowError(`${name} invalide: '${s}' (nombre entier attendu)`);
  }
  return n;
}
function optionalInt(row: unknown[], i: number, name: string): number | null {
  const s = cell(row, i);
  if (!s) {
    return null;
  }
  const n = Number(s);
  if (!Number.isInteger(n)) {
    throw new RowError(`${name} invalide: '${s}' (nombre entier attendu)`);
  }
  return n;
}

export async function startImport(file: File): Promise<number> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) {
    throw unprocessable('Le fichier envoyé est vide.');
  }
  if (bytes.length > MAX_FILE_SIZE_BYTES) {
    throw unprocessable('Ce fichier dépasse la taille maximale autorisée.');
  }
  if (file.type !== XLSX_MIME) {
    throw unprocessable("Ce type de fichier n'est pas autorisé. Seuls les fichiers .xlsx sont acceptés.");
  }

  let rows: unknown[][];
  try {
    const wb = XLSX.read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, raw: true, defval: null });
  } catch {
    throw unprocessable("Ce type de fichier n'est pas autorisé. Seuls les fichiers .xlsx sont acceptés.");
  }

  const jobExecutionId = nextJobId++;
  const startTime = new Date().toISOString();
  const rowErrors: ImportRowError[] = [];
  let readCount = 0;
  let writeCount = 0;
  let skipCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1;
    const companyNameRaw = cell(row, 0);
    try {
      const companyName = requiredString(row, 0, 'companyName');
      const enterpriseTypeRaw = requiredString(row, 1, 'enterpriseType');
      if (!ENTERPRISE_TYPES.has(enterpriseTypeRaw.toUpperCase())) {
        throw new RowError(`enterpriseType invalide: '${enterpriseTypeRaw}' (attendu: TPE, AUTO_ENTREPRENEUR, PME, ETI ou GE)`);
      }
      const enterpriseType = enterpriseTypeRaw.toUpperCase() as EnterpriseType;
      const amount = requiredDecimal(row, 2, 'amount');
      const duration = requiredInt(row, 3, 'duration');
      const applicableRate = optionalDecimal(row, 4);
      const contactEmail = requiredString(row, 5, 'contactEmail');
      if (!EMAIL_RE.test(contactEmail)) {
        throw new RowError(`contactEmail invalide: '${contactEmail}'`);
      }
      const contactPhone = requiredString(row, 6, 'contactPhone');
      const annualRevenue = optionalDecimal(row, 7);
      const existingAnnualDebtService = optionalDecimal(row, 8);
      const netAnnualResult = optionalDecimal(row, 9);
      const guaranteesValue = optionalDecimal(row, 10);
      const sector = cell(row, 11);
      const companyAgeYears = optionalInt(row, 12, 'companyAgeYears');

      readCount++;
      await createDemand({
        demandType: 'ENTERPRISE',
        contactName: companyName,
        amount,
        duration,
        applicableRate: applicableRate ?? 0,
        contactEmail,
        contactPhone,
        contactLanguage: null,
        enterpriseDetail: {
          enterpriseType,
          annualRevenue,
          existingAnnualDebtService,
          netAnnualResult,
          guaranteesValue,
          enterpriseId: null,
          sector,
          companyAgeYears,
        },
      });
      writeCount++;
    } catch (e) {
      skipCount++;
      rowErrors.push({ rowNumber, companyName: companyNameRaw, errorMessage: e instanceof Error ? e.message : 'Erreur de ligne' });
    }
  }

  reports.set(jobExecutionId, {
    jobExecutionId,
    status: 'COMPLETED',
    readCount,
    writeCount,
    skipCount,
    startTime,
    endTime: new Date().toISOString(),
    rowErrors,
  });
  return jobExecutionId;
}

export function getReport(jobExecutionId: number): ImportReport {
  const report = reports.get(jobExecutionId);
  if (!report) {
    throw notFound("Aucun import trouvé pour cet identifiant d'exécution.");
  }
  return report;
}
