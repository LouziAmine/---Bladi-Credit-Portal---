import { getAll, put } from '../core/demo-db';
import { StoreName } from '../core/demo-db';
import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { DemoResult, noContent, notFound, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import {
  BamParametersEntity,
  CreditRateEntity,
  InvestmentCreditParametersEntity,
  MourabahaParametersEntity,
} from '../core/entities';
import { CreditRateResponse } from '../../core/models/credit-rate.model';
import { BamParametersResponse } from '../../core/models/bam-parameters.model';
import { MourabahaParametersResponse } from '../../core/models/mourabaha-parameters.model';
import { InvestmentCreditParametersResponse } from '../../core/models/investment-credit-parameters.model';

interface WithPublicId {
  id: number;
  publicId: string;
}

function applyPatch<T extends object>(entity: T, body: unknown, allowed: (keyof T)[]): T {
  const patch = (body ?? {}) as Partial<T>;
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      entity[key] = patch[key] as T[keyof T];
    }
  }
  return entity;
}

async function resolveByPublicId<T extends WithPublicId>(store: StoreName, publicId: string): Promise<T> {
  const all = await getAll<T>(store);
  const found = all.find((e) => e.publicId === publicId);
  if (!found) {
    throw notFound('Paramètre introuvable.');
  }
  return found;
}

function toCreditRate(e: CreditRateEntity): CreditRateResponse {
  return {
    id: e.publicId,
    cspCode: e.cspCode,
    rateMin: e.rateMin,
    rateMax: e.rateMax,
    rateFormula: e.rateFormula as CreditRateResponse['rateFormula'],
    minDurationMonths: e.minDurationMonths,
    maxDurationMonths: e.maxDurationMonths,
    active: e.active,
  };
}

async function listCreditRates(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const all = (await getAll<CreditRateEntity>('creditRates')).sort((a, b) => a.id - b.id);
  const page = paginate(all.map(toCreditRate), queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20));
  return ok(page);
}

async function getCreditRate(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const e = await resolveByPublicId<CreditRateEntity>('creditRates', ctx.params['id']);
  return ok(toCreditRate(e));
}

async function patchCreditRate(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const e = await resolveByPublicId<CreditRateEntity>('creditRates', ctx.params['id']);
  applyPatch(e, ctx.body, ['rateMin', 'rateMax', 'rateFormula', 'minDurationMonths', 'maxDurationMonths', 'active']);
  e.version += 1;
  await put('creditRates', e);
  return noContent();
}

function toBam(e: BamParametersEntity): BamParametersResponse {
  return {
    id: e.publicId,
    processingFeesRatio: e.processingFeesRatio,
    minProcessingFees: e.minProcessingFees,
    maxProcessingFees: e.maxProcessingFees,
    registrationFeeRatio: e.registrationFeeRatio,
    landConservationRatio: e.landConservationRatio,
    notaryFeeRatio: e.notaryFeeRatio,
    ltvRatio: e.ltvRatio,
    maxDebtRatio: e.maxDebtRatio,
    maxAgeAtMaturity: e.maxAgeAtMaturity,
    adiMonthlyRate: e.adiMonthlyRate,
    active: e.active,
  };
}

async function listBam(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const all = (await getAll<BamParametersEntity>('bamParameters')).sort((a, b) => a.id - b.id);
  return ok(paginate(all.map(toBam), queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function getBam(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  return ok(toBam(await resolveByPublicId<BamParametersEntity>('bamParameters', ctx.params['id'])));
}

async function patchBam(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const e = await resolveByPublicId<BamParametersEntity>('bamParameters', ctx.params['id']);
  applyPatch(e, ctx.body, [
    'processingFeesRatio', 'minProcessingFees', 'maxProcessingFees', 'registrationFeeRatio',
    'landConservationRatio', 'notaryFeeRatio', 'ltvRatio', 'maxDebtRatio', 'maxAgeAtMaturity', 'adiMonthlyRate', 'active',
  ]);
  e.version += 1;
  await put('bamParameters', e);
  return noContent();
}

function toMourabaha(e: MourabahaParametersEntity): MourabahaParametersResponse {
  return {
    id: e.publicId,
    profitRate: e.profitRate,
    vatRate: e.vatRate,
    takafulMonthlyRate: e.takafulMonthlyRate,
    active: e.active,
  };
}

async function listMourabaha(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const all = (await getAll<MourabahaParametersEntity>('mourabahaParameters')).sort((a, b) => a.id - b.id);
  return ok(paginate(all.map(toMourabaha), queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function getMourabaha(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  return ok(toMourabaha(await resolveByPublicId<MourabahaParametersEntity>('mourabahaParameters', ctx.params['id'])));
}

async function patchMourabaha(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const e = await resolveByPublicId<MourabahaParametersEntity>('mourabahaParameters', ctx.params['id']);
  applyPatch(e, ctx.body, ['profitRate', 'vatRate', 'takafulMonthlyRate', 'active']);
  e.version += 1;
  await put('mourabahaParameters', e);
  return noContent();
}

function toInvestment(e: InvestmentCreditParametersEntity): InvestmentCreditParametersResponse {
  return {
    id: e.publicId,
    enterpriseType: e.enterpriseType,
    rateMin: e.rateMin,
    rateMax: e.rateMax,
    rateFormula: e.rateFormula as InvestmentCreditParametersResponse['rateFormula'],
    minCompanyAgeYears: e.minCompanyAgeYears,
    maxFinancingToRevenueRatio: e.maxFinancingToRevenueRatio,
    minGuaranteeCoverageRatio: e.minGuaranteeCoverageRatio,
    maxDebtServiceRatio: e.maxDebtServiceRatio,
    processingFeesRatio: e.processingFeesRatio,
    insurancePremiumRatio: e.insurancePremiumRatio,
    active: e.active,
  };
}

async function getInvestment(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  return ok(toInvestment(await resolveByPublicId<InvestmentCreditParametersEntity>('investmentCreditParameters', ctx.params['id'])));
}

async function getInvestmentByType(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const type = ctx.params['enterpriseType'];
  const all = await getAll<InvestmentCreditParametersEntity>('investmentCreditParameters');
  const found = all.find((e) => e.enterpriseType === type && e.active);
  if (!found) {
    throw notFound('Paramètres introuvables pour ce type.');
  }
  return ok(toInvestment(found));
}

async function patchInvestment(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const e = await resolveByPublicId<InvestmentCreditParametersEntity>('investmentCreditParameters', ctx.params['id']);
  applyPatch(e, ctx.body, [
    'rateMin', 'rateMax', 'rateFormula', 'minCompanyAgeYears', 'maxFinancingToRevenueRatio',
    'minGuaranteeCoverageRatio', 'maxDebtServiceRatio', 'processingFeesRatio', 'insurancePremiumRatio', 'active',
  ]);
  e.version += 1;
  await put('investmentCreditParameters', e);
  return noContent();
}

export const parametersRoutes = [
  { method: 'GET', pattern: '/credit-rates', handler: listCreditRates },
  { method: 'GET', pattern: '/credit-rates/:id', handler: getCreditRate },
  { method: 'PATCH', pattern: '/credit-rates/:id', handler: patchCreditRate },
  { method: 'GET', pattern: '/bam-parameters', handler: listBam },
  { method: 'GET', pattern: '/bam-parameters/:id', handler: getBam },
  { method: 'PATCH', pattern: '/bam-parameters/:id', handler: patchBam },
  { method: 'GET', pattern: '/mourabaha-parameters', handler: listMourabaha },
  { method: 'GET', pattern: '/mourabaha-parameters/:id', handler: getMourabaha },
  { method: 'PATCH', pattern: '/mourabaha-parameters/:id', handler: patchMourabaha },
  { method: 'GET', pattern: '/investment-credit-parameters/type/:enterpriseType', handler: getInvestmentByType },
  { method: 'GET', pattern: '/investment-credit-parameters/:id', handler: getInvestment },
  { method: 'PATCH', pattern: '/investment-credit-parameters/:id', handler: patchInvestment },
];
