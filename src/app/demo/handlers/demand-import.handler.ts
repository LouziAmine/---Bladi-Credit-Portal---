import { DemoContext, pathParamNumber, requireManager } from '../core/demo-context';
import { DemoResult, ok } from '../core/demo-result';
import { DemandImportReport, DemandImportStartResponse } from '../../core/models/demand-import.model';
import { getReport, startImport } from '../domain/demand-import';

async function start(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const file = (ctx.body as FormData).get('file') as File;
  const jobExecutionId = await startImport(file);
  return ok<DemandImportStartResponse>({ jobExecutionId });
}

async function report(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const r = getReport(pathParamNumber(ctx, 'jobExecutionId'));
  return ok<DemandImportReport>(r as DemandImportReport);
}

export const demandImportRoutes = [
  { method: 'POST', pattern: '/demands/import', handler: start },
  { method: 'GET', pattern: '/demands/import/:jobExecutionId', handler: report },
];
