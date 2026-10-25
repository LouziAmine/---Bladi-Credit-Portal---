import { getAll, nextId, put } from '../core/demo-db';
import { conflict, cryptoRandomId, notFound, unprocessable } from '../core/demo-result';
import { BamParametersEntity, InvestmentCreditParametersEntity, MourabahaParametersEntity } from '../core/entities';
import {
  CreditFileEntity,
  DemandEntity,
  EarlyRepaymentEntity,
  InstallmentEntity,
  PaymentEntity,
} from '../core/workflow-entities';
import { getDemand } from './workflow-repo';
import * as calc from './calc-engine';
import { createNotification } from './notifications';

const GRACE_PERIOD_DAYS = 30;
const INDEMNITY_MONTHS_OF_INTEREST = 1;
const INDEMNITY_MAX_SHARE = 0.03;
export const BENEFICIARY_NAME = 'Credit Bladi SA';
export const BENEFICIARY_RIB = '230 780 0123456789012345 03';

function isoDateOnly(iso: string): string {
  return iso.substring(0, 10);
}
function addDays(dateYmd: string, days: number): string {
  const d = new Date(dateYmd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}
function addMonths(dateYmd: string, months: number): string {
  const d = new Date(dateYmd + 'T00:00:00Z');
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);

  if (d.getUTCDate() < day) {
    d.setUTCDate(0);
  }
  return d.toISOString().substring(0, 10);
}

async function schedulePayments(demand: DemandEntity): Promise<number[]> {
  const amount = demand.amount;
  const duration = demand.duration;
  const rate = demand.applicableRate ?? 0;
  if (demand.demandType === 'ENTERPRISE') {
    const p = (await getAll<InvestmentCreditParametersEntity>('investmentCreditParameters')).find(
      (x) => x.enterpriseType === demand.enterpriseDetail!.enterpriseType && x.active,
    )!;
    return calc.computeInvestmentAtRate(amount, rate, duration, {
      processingFeesRatio: p.processingFeesRatio,
      insurancePremiumRatio: p.insurancePremiumRatio,
    }).schedule.map((r) => r.payment);
  }
  const detail = demand.mortgageDetail!;
  if (detail.productType === 'MOURABAHA') {
    const mp = (await getAll<MourabahaParametersEntity>('mourabahaParameters')).find((m) => m.active)!;
    return calc
      .computeMourabahaSchedule(amount, { profitRate: rate, vatRate: mp.vatRate, takafulMonthlyRate: mp.takafulMonthlyRate }, duration)
      .map((r) => r.payment);
  }
  const bam = (await getAll<BamParametersEntity>('bamParameters')).find((b) => b.active)!;
  const s = calc.computeConventionalAtRate(amount, detail.propertyValue ?? 0, rate, duration, bam, detail.coBorrower === true);
  return calc.computeConventionalSchedule(amount, rate, s.monthlyPayment, duration).map((r) => r.payment);
}

export async function openCreditFile(demandId: number, triggeredBy: string): Promise<CreditFileEntity> {
  const existing = (await getAll<CreditFileEntity>('creditFiles')).find((c) => c.demandId === demandId);
  if (existing) {
    return existing;
  }
  const demand = await getDemand(demandId);
  if (!demand) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  const reference = 'DOS-' + demand.reference.replace(/^DEM-/, '');
  const id = await nextId('creditFiles');
  const creditFile: CreditFileEntity = {
    id,
    publicId: cryptoRandomId(),
    demandId,
    reference,
    disbursedAt: demand.completedAt ?? new Date().toISOString(),
    disbursedAmount: demand.amount,
    status: 'ACTIVE',
    managedByUsername: triggeredBy,
  };
  await put('creditFiles', creditFile);

  const firstDue = addDays(isoDateOnly(creditFile.disbursedAt), GRACE_PERIOD_DAYS);
  const payments = await schedulePayments(demand);
  for (let i = 0; i < payments.length; i++) {
    const instId = await nextId('installments');
    const inst: InstallmentEntity = {
      id: instId,
      publicId: cryptoRandomId(),
      creditFileId: id,
      sequenceNumber: i + 1,
      dueDate: addMonths(firstDue, i),
      amount: payments[i],
      status: 'PENDING',
      paidAt: null,
      declaredAt: null,
      declaredBy: null,
      declaredSourceRib: null,
      latePenalty: 0,
    };
    await put('installments', inst);
  }
  return creditFile;
}

export async function creditFileByDemandId(demandId: number): Promise<CreditFileEntity> {
  const cf = (await getAll<CreditFileEntity>('creditFiles')).find((c) => c.demandId === demandId);
  if (!cf) {
    throw notFound("Aucun dossier de crédit n'a encore été ouvert pour cette demande.");
  }
  return cf;
}

export async function installmentsOf(creditFileId: number): Promise<InstallmentEntity[]> {
  return (await getAll<InstallmentEntity>('installments'))
    .filter((i) => i.creditFileId === creditFileId)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

async function requireInstallment(creditFile: CreditFileEntity, installmentPublicId: string): Promise<InstallmentEntity> {
  const all = await getAll<InstallmentEntity>('installments');
  const inst = all.find((i) => i.publicId === installmentPublicId);
  if (!inst) {
    throw notFound('Échéance introuvable pour cet identifiant.');
  }
  if (inst.creditFileId !== creditFile.id) {
    throw notFound("Cette échéance n'appartient pas à ce dossier de crédit.");
  }
  return inst;
}

function isSettled(i: InstallmentEntity): boolean {
  return i.status === 'PAID' || i.status === 'REPAID_EARLY';
}

export async function declarePayment(demandId: number, installmentPublicId: string, sourceRib: string): Promise<InstallmentEntity> {
  const cf = await creditFileByDemandId(demandId);
  if (cf.status !== 'ACTIVE') {
    throw conflict("Ce dossier de crédit est soldé : aucune opération n'est plus possible.");
  }
  const inst = await requireInstallment(cf, installmentPublicId);
  if (isSettled(inst)) {
    throw conflict('Cette échéance a déjà été payée.');
  }
  if (inst.status === 'DECLARED') {
    throw conflict('Un paiement a déjà été déclaré pour cette échéance et est en attente de validation.');
  }
  inst.status = 'DECLARED';
  inst.declaredBy = cf.managedByUsername;
  inst.declaredSourceRib = sourceRib;
  inst.declaredAt = new Date().toISOString();
  await put('installments', inst);

  const demand = await getDemand(demandId);
  if (cf.managedByUsername && demand) {
    await createNotification(
      cf.managedByUsername,
      'PAYMENT_DECLARED',
      'Paiement déclaré',
      `Un paiement a été déclaré pour l'échéance ${inst.sequenceNumber} du dossier ${demand.reference}.`,
      `/admin/demands/${demand.publicId}`,
    );
  }
  return inst;
}

export async function validatePayment(demandId: number, installmentPublicId: string): Promise<InstallmentEntity> {
  const cf = await creditFileByDemandId(demandId);
  const inst = await requireInstallment(cf, installmentPublicId);
  if (inst.status !== 'DECLARED') {
    throw conflict('Aucune déclaration de paiement en attente de validation pour cette échéance.');
  }
  const now = new Date().toISOString();
  inst.status = 'PAID';
  inst.paidAt = now;
  await put('installments', inst);

  const payId = await nextId('payments');
  const payment: PaymentEntity = { id: payId, installmentId: inst.id, amount: calc.money(inst.amount + inst.latePenalty), paidAt: now };
  await put('payments', payment);

  const remaining = (await installmentsOf(cf.id)).filter((i) => !isSettled(i));
  if (cf.status === 'ACTIVE' && remaining.length === 0) {
    cf.status = 'CLOSED';
    await put('creditFiles', cf);
  }
  return inst;
}

export async function rejectPayment(demandId: number, installmentPublicId: string): Promise<InstallmentEntity> {
  const cf = await creditFileByDemandId(demandId);
  const inst = await requireInstallment(cf, installmentPublicId);
  if (inst.status !== 'DECLARED') {
    throw conflict('Aucune déclaration de paiement en attente de validation pour cette échéance.');
  }
  const today = new Date().toISOString().substring(0, 10);
  inst.status = inst.dueDate < today ? 'LATE' : 'PENDING';
  await put('installments', inst);
  return inst;
}

export interface EarlyRepaymentQuote {
  fullRepayment: boolean;
  valueDate: string;
  outstandingBefore: number;
  repaidPrincipal: number;
  accruedInterest: number;
  indemnity: number;
  totalToPay: number;
  outstandingAfter: number;
  newMonthlyPayment: number | null;
  newSchedule: { installmentId: number; sequenceNumber: number; dueDate: string; amount: number }[];
}

async function repaymentContext(demandId: number): Promise<{ cf: CreditFileEntity; demand: DemandEntity; remaining: InstallmentEntity[] }> {
  const cf = await creditFileByDemandId(demandId);
  if (cf.status !== 'ACTIVE') {
    throw conflict("Ce dossier de crédit est soldé : aucune opération n'est plus possible.");
  }
  const demand = await getDemand(demandId);
  if (!demand || demand.mortgageDetail?.productType === 'MOURABAHA' || demand.applicableRate == null) {
    throw unprocessable("Le remboursement anticipé avec indemnité ne s'applique pas à un financement Mourabaha.");
  }
  const installments = await installmentsOf(cf.id);
  if (installments.some((i) => i.status === 'LATE' || i.status === 'DECLARED')) {
    throw conflict('Des échéances sont en retard ou en attente de validation : elles doivent être réglées avant un remboursement anticipé.');
  }
  const remaining = installments.filter((i) => i.status === 'PENDING');
  if (remaining.length === 0) {
    throw conflict("Ce dossier de crédit est soldé : aucune opération n'est plus possible.");
  }
  return { cf, demand, remaining };
}

function presentValue(remaining: InstallmentEntity[], monthlyRate: number): number {
  let discount = 1;
  let total = 0;
  const onePlus = 1 + monthlyRate;
  for (const inst of remaining) {
    discount *= onePlus;
    total += inst.amount / discount;
  }
  return calc.money(total);
}

function accruedInterest(repaid: number, monthlyRate: number, nextDueDate: string, valueDate: string): number {
  const periodStart = addMonths(nextDueDate, -1);
  const periodDays = daysBetween(periodStart, nextDueDate);
  const elapsed = Math.min(Math.max(daysBetween(periodStart, valueDate), 0), periodDays);
  if (periodDays === 0) {
    return 0;
  }
  return calc.money((repaid * monthlyRate * elapsed) / periodDays);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000);
}

function indemnityOf(repaidPrincipal: number, ratePercent: number, outstandingBefore: number): number {
  const interestCap = (repaidPrincipal * ratePercent * INDEMNITY_MONTHS_OF_INTEREST) / 1200;
  const outstandingCap = outstandingBefore * INDEMNITY_MAX_SHARE;
  return calc.money(Math.min(interestCap, outstandingCap));
}

export async function earlyRepaymentQuote(demandId: number, requestedPrincipal: number | null): Promise<EarlyRepaymentQuote> {
  const ctx = await repaymentContext(demandId);
  return computeQuote(ctx.remaining, ctx.demand.applicableRate!, requestedPrincipal);
}

function computeQuote(remaining: InstallmentEntity[], ratePercent: number, requestedPrincipal: number | null): EarlyRepaymentQuote {
  const monthlyRate = calc.monthlyRateOf(ratePercent);
  const outstanding = presentValue(remaining, monthlyRate);
  if (requestedPrincipal != null && (requestedPrincipal <= 0 || requestedPrincipal > outstanding)) {
    throw unprocessable('Le montant du remboursement anticipé doit être positif et ne pas dépasser le capital restant dû.');
  }
  const valueDate = new Date().toISOString().substring(0, 10);
  const full = requestedPrincipal == null || calc.money(requestedPrincipal) === outstanding;
  const repaid = full ? outstanding : requestedPrincipal!;
  const accrued = accruedInterest(repaid, monthlyRate, remaining[0].dueDate, valueDate);
  const indemnity = indemnityOf(repaid, ratePercent, outstanding);
  const outstandingAfter = calc.money(outstanding - repaid);
  let newSchedule: EarlyRepaymentQuote['newSchedule'] = [];
  let newMonthlyPayment: number | null = null;
  if (!full) {
    const months = remaining.length;
    const newPayment = calc.monthlyPayment(outstandingAfter, ratePercent, months);
    const rows = calc.computeConventionalSchedule(outstandingAfter, ratePercent, newPayment, months);
    newSchedule = remaining.map((inst, i) => ({ installmentId: inst.id, sequenceNumber: inst.sequenceNumber, dueDate: inst.dueDate, amount: rows[i].payment }));
    newMonthlyPayment = newSchedule.length ? newSchedule[0].amount : null;
  }
  return {
    fullRepayment: full,
    valueDate,
    outstandingBefore: outstanding,
    repaidPrincipal: repaid,
    accruedInterest: accrued,
    indemnity,
    totalToPay: calc.money(repaid + accrued + indemnity),
    outstandingAfter,
    newMonthlyPayment,
    newSchedule,
  };
}

export async function earlyRepay(demandId: number, requestedPrincipal: number | null, actor: string): Promise<EarlyRepaymentEntity> {
  const ctx = await repaymentContext(demandId);
  const quote = computeQuote(ctx.remaining, ctx.demand.applicableRate!, requestedPrincipal);
  const now = new Date().toISOString();

  if (quote.fullRepayment) {
    for (const inst of ctx.remaining) {
      inst.status = 'REPAID_EARLY';
      await put('installments', inst);
    }
    ctx.cf.status = 'CLOSED';
    await put('creditFiles', ctx.cf);
  } else {
    const byId = new Map(quote.newSchedule.map((s) => [s.installmentId, s.amount]));
    for (const inst of ctx.remaining) {
      const amt = byId.get(inst.id);
      if (amt != null) {
        inst.amount = amt;
        await put('installments', inst);
      }
    }
  }

  const id = await nextId('earlyRepayments');
  const record: EarlyRepaymentEntity = {
    id,
    publicId: cryptoRandomId(),
    creditFileId: ctx.cf.id,
    fullRepayment: quote.fullRepayment,
    outstandingBefore: quote.outstandingBefore,
    repaidPrincipal: quote.repaidPrincipal,
    accruedInterest: quote.accruedInterest,
    indemnity: quote.indemnity,
    totalPaid: quote.totalToPay,
    outstandingAfter: quote.outstandingAfter,
    performedBy: actor,
    performedAt: now,
  };
  await put('earlyRepayments', record);
  return record;
}

export async function earlyRepaymentHistory(demandId: number): Promise<EarlyRepaymentEntity[]> {
  const cf = await creditFileByDemandId(demandId);
  return (await getAll<EarlyRepaymentEntity>('earlyRepayments')).filter((e) => e.creditFileId === cf.id).sort((a, b) => a.id - b.id);
}
