import { getAll } from '../core/demo-db';
import { DemoContext, requireManager } from '../core/demo-context';
import { DemoResult, notFound, ok } from '../core/demo-result';
import { CreditFileEntity, DemandEntity, InstallmentEntity } from '../core/workflow-entities';
import { EnterpriseEntity } from '../core/client-entities';
import { CreditFileResponse, InstallmentResponse } from '../../core/models/credit-file.model';
import * as calc from '../domain/calc-engine';
import {
  BENEFICIARY_NAME,
  BENEFICIARY_RIB,
  creditFileByDemandId,
  installmentsOf,
  rejectPayment,
  validatePayment,
} from '../domain/servicing';

export async function resolveDemand(publicId: string): Promise<DemandEntity> {
  const d = (await getAll<DemandEntity>('demands')).find((x) => x.publicId === publicId);
  if (!d) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  return d;
}

function mapInstallment(i: InstallmentEntity): InstallmentResponse {
  return {
    id: i.publicId,
    sequenceNumber: i.sequenceNumber,
    dueDate: i.dueDate,
    amount: i.amount,
    status: i.status,
    paidAt: i.paidAt,
    declaredAt: i.declaredAt,
    declaredBy: i.declaredBy,
    declaredSourceRib: i.declaredSourceRib,
    latePenalty: i.latePenalty,
    totalDue: calc.money(i.amount + i.latePenalty),
  };
}

export async function mapCreditFile(cf: CreditFileEntity, demand: DemandEntity): Promise<CreditFileResponse> {
  const installments = (await installmentsOf(cf.id)).map(mapInstallment);
  let clientRib: string | null = null;
  if (demand.demandType === 'ENTERPRISE' && demand.enterpriseDetail?.enterpriseId != null) {
    const ent = (await getAll<EnterpriseEntity>('enterprises')).find((e) => e.id === demand.enterpriseDetail!.enterpriseId);
    clientRib = ent?.rib ?? null;
  }
  return {
    id: cf.publicId,
    demandId: demand.publicId,
    demandReference: demand.reference,
    companyName: demand.contactName,
    reference: cf.reference,
    disbursedAt: cf.disbursedAt,
    disbursedAmount: cf.disbursedAmount,
    status: cf.status,
    installments,
    beneficiaryName: BENEFICIARY_NAME,
    beneficiaryRib: BENEFICIARY_RIB,
    clientRib,
  };
}

async function getByDemand(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  const cf = await creditFileByDemandId(demand.id);
  return ok(await mapCreditFile(cf, demand));
}

async function validate(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  const inst = await validatePayment(demand.id, ctx.params['installmentId']);
  return ok(mapInstallment(inst));
}

async function reject(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  const inst = await rejectPayment(demand.id, ctx.params['installmentId']);
  return ok(mapInstallment(inst));
}

export { mapInstallment };

export const creditFileRoutes = [
  { method: 'GET', pattern: '/demands/:demandId/credit-file', handler: getByDemand },
  { method: 'POST', pattern: '/demands/:demandId/credit-file/installments/:installmentId/payments/validate', handler: validate },
  { method: 'POST', pattern: '/demands/:demandId/credit-file/installments/:installmentId/payments/reject', handler: reject },
];
