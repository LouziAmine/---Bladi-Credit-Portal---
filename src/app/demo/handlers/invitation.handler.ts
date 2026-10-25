import { DemoContext } from '../core/demo-context';
import { created, DemoResult, ok } from '../core/demo-result';
import { AcceptInvitationRequest, ClientInvitationPreviewResponse } from '../../core/models/client-invitation.model';
import { acceptInvitation, previewInvitation } from '../domain/client-domain';
import { getDemand } from '../domain/workflow-repo';

async function demandReferenceOf(demandId: number): Promise<string | null> {
  const d = await getDemand(demandId);
  return d?.reference ?? null;
}

async function preview(ctx: DemoContext): Promise<DemoResult> {
  const p = await previewInvitation(ctx.params['token'], demandReferenceOf);
  const res: ClientInvitationPreviewResponse = {
    email: p.email,
    enterpriseName: p.enterpriseName,
    demandReference: p.demandReference,
    expiresAt: p.expiresAt,
  };
  return ok(res);
}

async function accept(ctx: DemoContext): Promise<DemoResult> {
  const dto = (ctx.body ?? {}) as AcceptInvitationRequest;
  await acceptInvitation(ctx.params['token'], dto.username, dto.password);
  return created(undefined);
}

export const invitationRoutes = [
  { method: 'GET', pattern: '/invitations/:token', handler: preview },
  { method: 'POST', pattern: '/invitations/:token/accept', handler: accept },
];
