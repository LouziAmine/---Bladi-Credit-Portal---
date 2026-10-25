import { DemoContext, requireClient } from '../core/demo-context';
import { DemoResult, ok } from '../core/demo-result';
import { creditFileByDemandId, declarePayment } from '../domain/servicing';
import { assertClientApprovedForDemand } from '../domain/document-domain';
import { mapCreditFile, mapInstallment, resolveDemand } from './credit-file.handler';

async function getByDemand(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  const cf = await creditFileByDemandId(demand.id);
  return ok(await mapCreditFile(cf, demand));
}

async function payInstallment(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  const sourceRib = ((ctx.body ?? {}) as { sourceRib?: string }).sourceRib ?? '';
  const inst = await declarePayment(demand.id, ctx.params['installmentId'], sourceRib);
  return ok(mapInstallment(inst));
}

export const clientCreditFileRoutes = [
  { method: 'GET', pattern: '/me/demands/:demandId/credit-file', handler: getByDemand },
  { method: 'POST', pattern: '/me/demands/:demandId/credit-file/installments/:installmentId/payments', handler: payInstallment },
];
