import { getAll } from '../core/demo-db';
import { DemoContext, requireManager } from '../core/demo-context';
import { DemoResult, notFound, ok } from '../core/demo-result';
import { DemandDocumentEntity, DemandEntity, DocumentRequestEntity } from '../core/workflow-entities';
import { CreateDocumentRequestRequest, DocumentRequestResponse } from '../../core/models/document-request.model';
import { createRequest, listRequests } from '../domain/document-domain';

async function resolveDemand(publicId: string): Promise<DemandEntity> {
  const d = (await getAll<DemandEntity>('demands')).find((x) => x.publicId === publicId);
  if (!d) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  return d;
}

export async function mapRequest(req: DocumentRequestEntity, demandPublicId: string): Promise<DocumentRequestResponse> {
  let fulfilledDocumentId: string | null = null;
  if (req.fulfilledDocumentId != null) {
    const doc = (await getAll<DemandDocumentEntity>('documents')).find((d) => d.id === req.fulfilledDocumentId);
    fulfilledDocumentId = doc?.publicId ?? null;
  }
  return {
    id: req.publicId,
    demandId: demandPublicId,
    documentType: req.documentType,
    status: req.status,
    requestedByUsername: req.requestedByUsername,
    createdAt: req.createdAt,
    fulfilledDocumentId,
    fulfilledAt: req.fulfilledAt,
  };
}

async function create(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const demand = await resolveDemand(ctx.params['id']);
  const dto = (ctx.body ?? {}) as CreateDocumentRequestRequest;
  const req = await createRequest(demand.id, dto.documentType, actor.username);
  return ok(await mapRequest(req, demand.publicId));
}

async function list(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['id']);
  const reqs = await listRequests(demand.id);
  return ok(await Promise.all(reqs.map((r) => mapRequest(r, demand.publicId))));
}

export const documentRequestRoutes = [
  { method: 'POST', pattern: '/demands/:id/document-requests', handler: create },
  { method: 'GET', pattern: '/demands/:id/document-requests', handler: list },
];
