import { DemoContext, queryInt, requireClient } from '../core/demo-context';
import { created, DemoResult, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { getAll } from '../core/demo-db';
import { EnterpriseEntity } from '../core/client-entities';
import { DemandEntity } from '../core/workflow-entities';
import {
  ClaimEnterpriseLinkRequest,
  ClientDemandSummaryResponse,
  ClientPortfolioEnterpriseResponse,
} from '../../core/models/enterprise-user-link.model';
import {
  approvedLinksByUser,
  assertApprovedForEnterprise,
  borrowerDemandIds,
  claimEnterprise,
  enterpriseByPublicId,
  linksByUser,
} from '../domain/client-domain';
import { mapLink } from './enterprise-link.handler';

function toDemandSummary(d: DemandEntity): ClientDemandSummaryResponse {
  return {
    id: d.publicId,
    reference: d.reference,
    enterpriseType: d.demandType === 'ENTERPRISE' ? d.enterpriseDetail!.enterpriseType : null,
    amount: d.amount,
    duration: d.duration,
    applicableRate: d.applicableRate,
    createdAt: d.createdAt,
    completedAt: d.completedAt,
    completed: d.completedAt != null,
    rejected: d.rejectedAt != null,
  };
}

async function claim(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const dto = (ctx.body ?? {}) as ClaimEnterpriseLinkRequest;
  const link = await claimEnterprise(dto.registrationNumber, dto.role, actor.username);
  return created(await mapLink(link));
}

async function myLinks(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const links = await linksByUser(actor.userId);
  return ok(await Promise.all(links.map(mapLink)));
}

async function myPortfolio(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const links = await approvedLinksByUser(actor.userId);
  const enterprises = await getAll<EnterpriseEntity>('enterprises');
  const portfolio: ClientPortfolioEnterpriseResponse[] = links.map((link) => {
    const e = enterprises.find((x) => x.id === link.enterpriseId);
    return { enterpriseId: e?.publicId ?? '', name: e?.name ?? '', sector: e?.sector ?? null, linkRole: link.role };
  });
  return ok(portfolio);
}

async function portfolioDemands(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const enterprise = await enterpriseByPublicId(ctx.params['enterpriseId']);
  await assertApprovedForEnterprise(actor.userId, enterprise.id);
  const demands = (await getAll<DemandEntity>('demands'))
    .filter((d) => d.enterpriseDetail?.enterpriseId === enterprise.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .map(toDemandSummary);
  return ok(paginate(demands, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function myMortgageDemands(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const ids = await borrowerDemandIds(actor.userId);
  const demands = await getAll<DemandEntity>('demands');
  const summaries = ids
    .map((id) => demands.find((d) => d.id === id))
    .filter((d): d is DemandEntity => !!d)
    .map(toDemandSummary);
  return ok(summaries);
}

export const clientPortfolioRoutes = [
  { method: 'POST', pattern: '/me/enterprise-links', handler: claim },
  { method: 'GET', pattern: '/me/enterprise-links', handler: myLinks },
  { method: 'GET', pattern: '/me/portfolio', handler: myPortfolio },
  { method: 'GET', pattern: '/me/portfolio/:enterpriseId/demands', handler: portfolioDemands },
  { method: 'GET', pattern: '/me/mortgage-demands', handler: myMortgageDemands },
];
