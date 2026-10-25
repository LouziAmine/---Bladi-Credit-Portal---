import { DemoContext, requireClient, requireManager } from '../core/demo-context';
import { DemoResult, ok } from '../core/demo-result';
import {
  EarlyRepaymentQuote,
  earlyRepay,
  earlyRepaymentHistory,
  earlyRepaymentQuote,
} from '../domain/servicing';
import { EarlyRepaymentEntity } from '../core/workflow-entities';
import { EarlyRepaymentQuoteResponse, EarlyRepaymentResponse } from '../../core/models/early-repayment.model';
import { assertClientApprovedForDemand } from '../domain/document-domain';
import { resolveDemand } from './credit-file.handler';

function mapQuote(q: EarlyRepaymentQuote): EarlyRepaymentQuoteResponse {
  return {
    fullRepayment: q.fullRepayment,
    valueDate: q.valueDate,
    outstandingBefore: q.outstandingBefore,
    repaidPrincipal: q.repaidPrincipal,
    accruedInterest: q.accruedInterest,
    indemnity: q.indemnity,
    totalToPay: q.totalToPay,
    outstandingAfter: q.outstandingAfter,
    newMonthlyPayment: q.newMonthlyPayment,
    newSchedule: q.newSchedule.map((s) => ({ sequenceNumber: s.sequenceNumber, dueDate: s.dueDate, amount: s.amount })),
  };
}

function mapRepayment(e: EarlyRepaymentEntity): EarlyRepaymentResponse {
  return {
    id: e.publicId,
    fullRepayment: e.fullRepayment,
    outstandingBefore: e.outstandingBefore,
    repaidPrincipal: e.repaidPrincipal,
    accruedInterest: e.accruedInterest,
    indemnity: e.indemnity,
    totalPaid: e.totalPaid,
    outstandingAfter: e.outstandingAfter,
    performedBy: e.performedBy,
    performedAt: e.performedAt,
  };
}

function amountParam(ctx: DemoContext): number | null {
  const raw = ctx.query.get('amount');
  return raw != null && raw !== '' ? Number(raw) : null;
}

async function quote(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  return ok(mapQuote(await earlyRepaymentQuote(demand.id, amountParam(ctx))));
}

async function repay(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  const amount = ((ctx.body ?? {}) as { amount?: number }).amount ?? null;
  const record = await earlyRepay(demand.id, amount, actor.username);
  return ok(mapRepayment(record));
}

async function history(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  return ok((await earlyRepaymentHistory(demand.id)).map(mapRepayment));
}

async function clientQuote(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  return ok(mapQuote(await earlyRepaymentQuote(demand.id, amountParam(ctx))));
}

export const earlyRepaymentRoutes = [
  { method: 'GET', pattern: '/demands/:demandId/credit-file/early-repayments/quote', handler: quote },
  { method: 'POST', pattern: '/demands/:demandId/credit-file/early-repayments', handler: repay },
  { method: 'GET', pattern: '/demands/:demandId/credit-file/early-repayments', handler: history },
  { method: 'GET', pattern: '/me/demands/:demandId/credit-file/early-repayments/quote', handler: clientQuote },
];
