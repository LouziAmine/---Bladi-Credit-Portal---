import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { created, DemoResult, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { EnterpriseEntity, EnterpriseUserLinkEntity } from '../core/client-entities';
import { getAll } from '../core/demo-db';
import { UserEntity } from '../core/entities';
import { EnterpriseUserLinkResponse, InviteEnterpriseLinkRequest } from '../../core/models/enterprise-user-link.model';
import {
  approveLink,
  enterpriseByPublicId,
  inviteClient,
  linksByEnterprise,
  pendingLinks,
  rejectLink,
  revokeLink,
} from '../domain/client-domain';

export async function mapLink(link: EnterpriseUserLinkEntity): Promise<EnterpriseUserLinkResponse> {
  const enterprises = await getAll<EnterpriseEntity>('enterprises');
  const users = await getAll<UserEntity>('users');
  const enterprise = enterprises.find((e) => e.id === link.enterpriseId);
  const user = users.find((u) => u.id === link.userId);
  return {
    id: link.publicId,
    enterpriseId: enterprise?.publicId ?? '',
    userId: user?.publicId ?? '',
    role: link.role,
    status: link.status,
    origin: link.origin,
    requestedByUsername: link.requestedByUsername,
    decidedByUsername: link.decidedByUsername,
    decidedAt: link.decidedAt,
    createdAt: link.createdAt,
    username: user?.username ?? null,
  };
}

async function mapLinks(links: EnterpriseUserLinkEntity[]): Promise<EnterpriseUserLinkResponse[]> {
  return Promise.all(links.map(mapLink));
}

async function invite(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const enterprise = await enterpriseByPublicId(ctx.params['enterpriseId']);
  const dto = (ctx.body ?? {}) as InviteEnterpriseLinkRequest;
  const link = await inviteClient(enterprise.id, dto.username, dto.role, actor.username);
  return created(await mapLink(link));
}

async function listForEnterprise(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const enterprise = await enterpriseByPublicId(ctx.params['enterpriseId']);
  const links = await mapLinks(await linksByEnterprise(enterprise.id));
  return ok(paginate(links, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function listPending(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const links = await mapLinks(await pendingLinks());
  return ok(paginate(links, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function approve(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  return ok(await mapLink(await approveLink(ctx.params['linkId'], actor.username)));
}

async function reject(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  return ok(await mapLink(await rejectLink(ctx.params['linkId'], actor.username)));
}

async function revoke(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  return ok(await mapLink(await revokeLink(ctx.params['linkId'], actor.username)));
}

export const enterpriseLinkRoutes = [
  { method: 'POST', pattern: '/enterprises/:enterpriseId/user-links', handler: invite },
  { method: 'GET', pattern: '/enterprises/:enterpriseId/user-links', handler: listForEnterprise },
  { method: 'GET', pattern: '/enterprise-user-links', handler: listPending },
  { method: 'PATCH', pattern: '/enterprise-user-links/:linkId/approve', handler: approve },
  { method: 'PATCH', pattern: '/enterprise-user-links/:linkId/reject', handler: reject },
  { method: 'PATCH', pattern: '/enterprise-user-links/:linkId/revoke', handler: revoke },
];
