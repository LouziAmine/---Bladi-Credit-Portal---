import { getAll, nextId, put } from '../core/demo-db';
import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { created, cryptoRandomId, DemoResult, notFound, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { BamParametersEntity, InvestmentCreditParametersEntity, MourabahaParametersEntity } from '../core/entities';
import { CspCode } from '../../core/models/mortgage-credit.model';
import {
  DemandAssignmentEntity,
  DemandCommentEntity,
  DemandEntity,
  StepInfo,
  StepInstanceEntity,
} from '../core/workflow-entities';
import {
  AddDemandCommentRequest,
  AdvanceDemandRequest,
  AssignDemandRequest,
  ClassifyDemandRequest,
  DemandAmortizationResponse,
  DemandAssignmentHistoryEntryResponse,
  DemandCommentResponse,
  DemandHistoryEntryResponse,
  DemandPipelineStepResponse,
  DemandResponse,
  DemandStepResponse,
} from '../../core/models/demand.model';
import {
  allStepsForWorkflow,
  demandStatus,
  findOpenStepInstance,
  findStepInstances,
  stepInfoByWpsId,
} from '../domain/workflow-repo';
import { advance, assign, classify, eligibleAssignees } from '../domain/workflow-engine';
import * as calc from '../domain/calc-engine';
import { toUserResponse } from './users.handler';

async function resolveDemand(publicId: string): Promise<DemandEntity> {
  const demands = await getAll<DemandEntity>('demands');
  const d = demands.find((x) => x.publicId === publicId);
  if (!d) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  return d;
}

async function enterprisePublicIdOf(enterpriseId: number | null): Promise<string | null> {
  if (enterpriseId == null) {
    return null;
  }
  const enterprises = await getAll<{ id: number; publicId: string }>('enterprises');
  return enterprises.find((e) => e.id === enterpriseId)?.publicId ?? null;
}

async function mapDemand(d: DemandEntity, currentProcessName: string | null, currentStepName: string | null): Promise<DemandResponse> {
  const enterprise = d.enterpriseDetail
    ? {
        enterpriseType: d.enterpriseDetail.enterpriseType,
        enterpriseId: await enterprisePublicIdOf(d.enterpriseDetail.enterpriseId),
        sector: d.enterpriseDetail.sector,
        companyAgeYears: d.enterpriseDetail.companyAgeYears,
        annualRevenue: d.enterpriseDetail.annualRevenue,
        netAnnualResult: d.enterpriseDetail.netAnnualResult,
        existingAnnualDebtService: d.enterpriseDetail.existingAnnualDebtService,
        guaranteesValue: d.enterpriseDetail.guaranteesValue,
      }
    : null;
  const mortgage = d.mortgageDetail
    ? {
        productType: d.mortgageDetail.productType,
        cspCode: d.mortgageDetail.cspCode as CspCode | null,
        propertyValue: d.mortgageDetail.propertyValue,
        monthlyIncome: d.mortgageDetail.monthlyIncome,
      }
    : null;
  return {
    id: d.publicId,
    reference: d.reference,
    demandType: d.demandType,
    contactName: d.contactName,
    amount: d.amount,
    duration: d.duration,
    createdAt: d.createdAt,
    completedAt: d.completedAt,
    completed: d.completedAt != null,
    applicableRate: d.applicableRate,
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    currentProcessName,
    currentStepName,
    rejected: d.rejectedAt != null,
    rejectedAt: d.rejectedAt,
    enterprise,
    mortgage,
  };
}

function stepInstanceToStepResponse(info: StepInfo, instance: StepInstanceEntity): DemandStepResponse {
  return {
    processCode: info.processCode,
    processName: info.processName,
    stepCode: info.stepCode,
    stepName: info.stepName,
    typicalRole: info.typicalRole,
    requiredGradeCode: info.requiredGradeCode,
    requiredGradeName: info.requiredGradeName,
    requiredTeamCode: info.requiredTeamCode,
    requiredTeamName: info.requiredTeamName,
    assignedUsername: instance.assignedUsername,
    assignedBy: instance.assignedBy,
    enteredAt: instance.enteredAt,
  };
}

async function currentStepOf(demand: DemandEntity): Promise<{ info: StepInfo; instance: StepInstanceEntity } | null> {
  const open = await findOpenStepInstance(demand.id);
  if (open) {
    const info = await stepInfoByWpsId(open.workflowProcessStepId);
    return info ? { info, instance: open } : null;
  }
  const all = await findStepInstances(demand.id);
  if (!all.length) {
    return null;
  }
  const last = all[all.length - 1];
  const info = await stepInfoByWpsId(last.workflowProcessStepId);
  return info ? { info, instance: last } : null;
}

async function listDemands(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  let demands = await getAll<DemandEntity>('demands');

  const enterpriseId = ctx.query.get('enterpriseId');
  if (enterpriseId) {
    const enterprises = await getAll<{ id: number; publicId: string }>('enterprises');
    const ent = enterprises.find((e) => e.publicId === enterpriseId);
    demands = ent ? demands.filter((d) => d.enterpriseDetail?.enterpriseId === ent.id) : [];
  }
  const companyName = ctx.query.get('companyName');
  if (companyName) {
    const lc = companyName.toLowerCase();
    demands = demands.filter((d) => d.contactName.toLowerCase().includes(lc));
  }
  const status = ctx.query.get('status');
  if (status) {
    demands = demands.filter((d) => demandStatus(d) === status);
  }
  const minAmount = ctx.query.get('minAmount');
  if (minAmount) {
    demands = demands.filter((d) => d.amount >= Number(minAmount));
  }
  const maxAmount = ctx.query.get('maxAmount');
  if (maxAmount) {
    demands = demands.filter((d) => d.amount <= Number(maxAmount));
  }

  demands.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const page = paginate(demands, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20));
  const items = await Promise.all(
    page.items.map(async (d) => {
      const current = await currentStepOf(d);
      const open = await findOpenStepInstance(d.id);

      return mapDemand(d, open && current ? current.info.processName : null, open && current ? current.info.stepName : null);
    }),
  );
  return ok({ ...page, items });
}

async function getDemandById(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  return ok(await mapDemand(d, null, null));
}

async function getCurrentStep(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const current = await currentStepOf(d);
  if (!current) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  return ok(stepInstanceToStepResponse(current.info, current.instance));
}

async function getHistory(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const instances = await findStepInstances(d.id);
  const entries: DemandHistoryEntryResponse[] = [];
  for (const inst of instances) {
    const info = await stepInfoByWpsId(inst.workflowProcessStepId);
    if (!info) {
      continue;
    }
    entries.push({
      processCode: info.processCode,
      processName: info.processName,
      stepCode: info.stepCode,
      stepName: info.stepName,
      typicalRole: info.typicalRole,
      requiredGradeCode: info.requiredGradeCode,
      requiredGradeName: info.requiredGradeName,
      requiredTeamCode: info.requiredTeamCode,
      requiredTeamName: info.requiredTeamName,
      assignedUsername: inst.assignedUsername,
      assignedBy: inst.assignedBy,
      enteredAt: inst.enteredAt,
      exitedAt: inst.exitedAt,
      decisionNote: inst.decisionNote,
      decisionOutcome: inst.decisionOutcome as DemandHistoryEntryResponse['decisionOutcome'],
      returnReasonCode: inst.returnReasonCode,
      recommendations: inst.recommendations,
      reserves: inst.reserves,
      committeeType: inst.committeeType as DemandHistoryEntryResponse['committeeType'],
      insuranceAdiSubscribed: inst.insuranceAdiSubscribed,
      insuranceCoverageType: inst.insuranceCoverageType as DemandHistoryEntryResponse['insuranceCoverageType'],
      insuranceDamageSubscribed: inst.insuranceDamageSubscribed,
      rateOption: inst.rateOption as DemandHistoryEntryResponse['rateOption'],
      previousRate: inst.previousRate,
      appliedRate: inst.appliedRate,
      rateChangedBy: inst.rateChangedBy,
      amountOption: inst.amountOption as DemandHistoryEntryResponse['amountOption'],
      previousAmount: inst.previousAmount,
      appliedAmount: inst.appliedAmount,
      durationOption: inst.durationOption as DemandHistoryEntryResponse['durationOption'],
      previousDuration: inst.previousDuration,
      appliedDuration: inst.appliedDuration,
      classificationOutcome: inst.classificationOutcome as DemandHistoryEntryResponse['classificationOutcome'],
    });
  }
  return ok(entries);
}

async function getPipeline(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const steps = await allStepsForWorkflow(d.workflowId);
  const instances = await findStepInstances(d.id);

  const latestByStepCode = new Map<string, StepInstanceEntity>();
  for (const inst of instances) {
    const info = await stepInfoByWpsId(inst.workflowProcessStepId);
    if (info) {
      latestByStepCode.set(info.stepCode, inst);
    }
  }
  const pipeline: DemandPipelineStepResponse[] = steps.map((step) => {
    const entry = latestByStepCode.get(step.stepCode);
    const status: DemandPipelineStepResponse['status'] = !entry ? 'UPCOMING' : entry.exitedAt != null ? 'DONE' : 'CURRENT';
    return {
      processCode: step.processCode,
      processName: step.processName,
      stepCode: step.stepCode,
      stepName: step.stepName,
      typicalRole: step.typicalRole,
      requiredGradeCode: step.requiredGradeCode,
      requiredGradeName: step.requiredGradeName,
      requiredTeamCode: step.requiredTeamCode,
      requiredTeamName: step.requiredTeamName,
      globalOrder: step.globalOrder,
      status,
      enteredAt: entry ? entry.enteredAt : null,
      exitedAt: entry ? entry.exitedAt : null,
    };
  });
  return ok(pipeline);
}

async function advanceDemand(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const dto = (ctx.body ?? {}) as AdvanceDemandRequest;
  const updated = await advance(
    d.id,
    {
      note: dto.note ?? null,
      decisionOutcome: dto.decisionOutcome ?? null,
      returnReasonCode: dto.returnReasonCode ?? null,
      recommendations: dto.recommendations ?? null,
      reserves: dto.reserves ?? null,
      committeeType: dto.committeeType ?? null,
      insuranceAdiSubscribed: dto.insuranceAdiSubscribed ?? null,
      insuranceCoverageType: dto.insuranceCoverageType ?? null,
      insuranceDamageSubscribed: dto.insuranceDamageSubscribed ?? null,
      rateOption: dto.rateOption,
      manualRate: dto.manualRate ?? null,
      amountOption: dto.amountOption,
      manualAmount: dto.manualAmount ?? null,
      durationOption: dto.durationOption,
      manualDuration: dto.manualDuration ?? null,
    },
    dto.assigneeUsername ?? null,
    actor.username,
  );
  return ok(await mapDemand(updated, null, null));
}

async function classifyDemand(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const dto = (ctx.body ?? {}) as ClassifyDemandRequest;
  const updated = await classify(
    d.id,
    dto.classificationOutcome,
    dto.enterpriseId ?? null,
    dto.note ?? null,
    dto.assigneeUsername ?? null,
    actor.username,
  );
  return ok(await mapDemand(updated, null, null));
}

async function assignDemand(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const dto = (ctx.body ?? {}) as AssignDemandRequest;
  const instance = await assign(d.id, dto.username, actor.username);
  const info = await stepInfoByWpsId(instance.workflowProcessStepId);
  return ok(stepInstanceToStepResponse(info!, instance));
}

async function getAssignmentHistory(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const all = (await getAll<DemandAssignmentEntity>('demandAssignments'))
    .filter((a) => a.demandId === d.id)
    .sort((a, b) => (a.assignedAt < b.assignedAt ? -1 : a.assignedAt > b.assignedAt ? 1 : a.id - b.id));
  const entries: DemandAssignmentHistoryEntryResponse[] = all.map((a) => ({
    id: a.publicId,
    stepCode: a.stepCode,
    stepName: a.stepName,
    previousUsername: a.previousUsername,
    newUsername: a.newUsername,
    assignedBy: a.assignedBy,
    assignedAt: a.assignedAt,
  }));
  return ok(entries);
}

async function getEligibleAssignees(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const direction = (ctx.query.get('direction') ?? 'CURRENT') as 'CURRENT' | 'NEXT' | 'PREVIOUS';
  const users = await eligibleAssignees(d.id, direction, actor.username);
  const mapped = await Promise.all(users.map(toUserResponse));
  return ok(mapped);
}

async function getComments(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const comments = (await getAll<DemandCommentEntity>('demandComments'))
    .filter((c) => c.demandId === d.id)
    .sort((a, b) => a.id - b.id);
  return ok<DemandCommentResponse[]>(
    comments.map((c) => ({ id: c.publicId, stepCode: c.stepCode, stepName: c.stepName, username: c.username, comment: c.comment, createdAt: c.createdAt })),
  );
}

async function addComment(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const current = await currentStepOf(d);
  if (!current) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  const dto = (ctx.body ?? {}) as AddDemandCommentRequest;
  const id = await nextId('demandComments');
  const comment: DemandCommentEntity = {
    id,
    publicId: cryptoRandomId(),
    demandId: d.id,
    stepCode: current.info.stepCode,
    stepName: current.info.stepName,
    username: actor.username,
    comment: dto.comment,
    createdAt: new Date().toISOString(),
  };
  await put('demandComments', comment);
  return created<DemandCommentResponse>({
    id: comment.publicId,
    stepCode: comment.stepCode,
    stepName: comment.stepName,
    username: comment.username,
    comment: comment.comment,
    createdAt: comment.createdAt,
  });
}

async function getAmortization(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const d = await resolveDemand(ctx.params['id']);
  const rateOverride = ctx.query.get('rate') != null ? Number(ctx.query.get('rate')) : null;
  const amountOverride = ctx.query.get('amount') != null ? Number(ctx.query.get('amount')) : null;
  const durationOverride = ctx.query.get('duration') != null ? Number(ctx.query.get('duration')) : null;

  const amount = amountOverride ?? d.amount;
  const duration = durationOverride ?? d.duration;
  const rate = rateOverride ?? d.applicableRate;
  if (rate == null) {
    throw notFound("Ce dossier n'a pas encore de taux applicable.");
  }

  const base = { demandId: d.publicId, reference: d.reference, amount, duration };

  if (d.demandType === 'ENTERPRISE') {
    const params = (await getAll<InvestmentCreditParametersEntity>('investmentCreditParameters')).find(
      (p) => p.enterpriseType === d.enterpriseDetail!.enterpriseType && p.active,
    )!;
    const s = calc.computeInvestmentAtRate(amount, rate, duration, {
      processingFeesRatio: params.processingFeesRatio,
      insurancePremiumRatio: params.insurancePremiumRatio,
    });
    const res: DemandAmortizationResponse = {
      ...base,
      applicableRate: rate,
      processingFees: s.processingFees,
      taeg: s.taeg,
      amortizationSchedule: s.schedule,
      insurancePremium: s.insurancePremium,
      allInMonthlyPayment: s.allInMonthlyPayment,
      totalInsuranceCost: s.totalInsuranceCost,
      enterprise: { monthlyPayment: s.monthlyPayment, annualDebtService: s.annualDebtService, totalInterest: s.totalInterest, totalCost: s.totalCost },
      conventional: null,
      mourabaha: null,
    };
    return ok(res);
  }

  const bam = (await getAll<BamParametersEntity>('bamParameters')).find((b) => b.active)!;
  const detail = d.mortgageDetail!;
  const coBorrower = detail.coBorrower === true;
  const propertyValue = detail.propertyValue ?? 0;

  if (detail.productType === 'MOURABAHA') {
    const mp = (await getAll<MourabahaParametersEntity>('mourabahaParameters')).find((m) => m.active)!;
    const params = { profitRate: rate, vatRate: mp.vatRate, takafulMonthlyRate: mp.takafulMonthlyRate };
    const s = calc.computeMourabaha(amount, propertyValue, params, duration, bam, coBorrower);
    const schedule = calc.computeMourabahaSchedule(amount, params, duration);
    const taeg = calc.calculateTaeg(amount, s.processingFees, s.allInMonthlyPaymentTtc, duration);
    const res: DemandAmortizationResponse = {
      ...base,
      applicableRate: rate,
      processingFees: s.processingFees,
      taeg,
      amortizationSchedule: schedule,
      insurancePremium: s.takafulMonthlyContribution,
      allInMonthlyPayment: s.allInMonthlyPaymentTtc,
      totalInsuranceCost: s.totalTakafulCost,
      enterprise: null,
      conventional: null,
      mourabaha: { marginHt: s.marginHt, vatOnMargin: s.vatOnMargin, marginTtc: s.marginTtc, monthlyPaymentTtc: s.monthlyPaymentTtc },
    };
    return ok(res);
  }

  const s = calc.computeConventionalAtRate(amount, propertyValue, rate, duration, bam, coBorrower);
  const schedule = calc.computeConventionalSchedule(amount, rate, s.monthlyPayment, duration);
  const taeg = calc.calculateTaeg(amount, s.processingFees, s.allInMonthlyPayment, duration);
  const res: DemandAmortizationResponse = {
    ...base,
    applicableRate: rate,
    processingFees: s.processingFees,
    taeg,
    amortizationSchedule: schedule,
    insurancePremium: s.adiMonthlyPremium,
    allInMonthlyPayment: s.allInMonthlyPayment,
    totalInsuranceCost: s.totalAdiCost,
    enterprise: null,
    conventional: { monthlyPayment: s.monthlyPayment, totalInterest: s.totalInterest, totalCost: s.totalCost },
    mourabaha: null,
  };
  return ok(res);
}

export const demandRoutes = [
  { method: 'GET', pattern: '/demands', handler: listDemands },
  { method: 'GET', pattern: '/demands/:id', handler: getDemandById },
  { method: 'GET', pattern: '/demands/:id/current-step', handler: getCurrentStep },
  { method: 'GET', pattern: '/demands/:id/history', handler: getHistory },
  { method: 'GET', pattern: '/demands/:id/pipeline', handler: getPipeline },
  { method: 'GET', pattern: '/demands/:id/amortization', handler: getAmortization },
  { method: 'POST', pattern: '/demands/:id/advance', handler: advanceDemand },
  { method: 'POST', pattern: '/demands/:id/classify', handler: classifyDemand },
  { method: 'POST', pattern: '/demands/:id/assign', handler: assignDemand },
  { method: 'GET', pattern: '/demands/:id/assignment-history', handler: getAssignmentHistory },
  { method: 'GET', pattern: '/demands/:id/eligible-assignees', handler: getEligibleAssignees },
  { method: 'GET', pattern: '/demands/:id/comments', handler: getComments },
  { method: 'POST', pattern: '/demands/:id/comments', handler: addComment },
];
