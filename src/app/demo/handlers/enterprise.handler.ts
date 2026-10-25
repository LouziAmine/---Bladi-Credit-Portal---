import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { created, DemoResult, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { EnterpriseEntity } from '../core/client-entities';
import { CreateEnterpriseRequest, EnterpriseMatchResponse, EnterpriseResponse } from '../../core/models/enterprise.model';
import { createEnterprise, enterpriseByPublicId, listEnterprises, matchEnterpriseByName } from '../domain/client-domain';

export function toEnterpriseResponse(e: EnterpriseEntity): EnterpriseResponse {
  return { id: e.publicId, name: e.name, sector: e.sector, registrationNumber: e.registrationNumber, createdAt: e.createdAt };
}

async function create(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const dto = (ctx.body ?? {}) as CreateEnterpriseRequest;
  const e = await createEnterprise(dto.name, dto.sector ?? null, dto.registrationNumber ?? null);
  return created<EnterpriseResponse>(toEnterpriseResponse(e));
}

async function list(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const all = (await listEnterprises()).map(toEnterpriseResponse);
  return ok(paginate(all, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function getById(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  return ok(toEnterpriseResponse(await enterpriseByPublicId(ctx.params['id'])));
}

async function match(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const name = ctx.query.get('name') ?? '';
  const matched = await matchEnterpriseByName(name);
  const res: EnterpriseMatchResponse = { matched: matched !== null, enterprise: matched ? toEnterpriseResponse(matched) : null };
  return ok(res);
}

export const enterpriseRoutes = [
  { method: 'POST', pattern: '/enterprises', handler: create },
  { method: 'GET', pattern: '/enterprises/match', handler: match },
  { method: 'GET', pattern: '/enterprises', handler: list },
  { method: 'GET', pattern: '/enterprises/:id', handler: getById },
];
