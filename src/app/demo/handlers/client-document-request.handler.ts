import { getAll } from '../core/demo-db';
import { DemoContext, requireClient } from '../core/demo-context';
import { DemoResult, notFound, ok } from '../core/demo-result';
import { DemandEntity } from '../core/workflow-entities';
import { assertClientApprovedForDemand, downloadFulfilled, listRequests, uploadForRequest } from '../domain/document-domain';
import { mapRequest } from './document-request.handler';
import { mapDocument } from './document.handler';

async function resolveDemand(publicId: string): Promise<DemandEntity> {
  const d = (await getAll<DemandEntity>('demands')).find((x) => x.publicId === publicId);
  if (!d) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  return d;
}

async function list(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  const reqs = await listRequests(demand.id);
  return ok(await Promise.all(reqs.map((r) => mapRequest(r, demand.publicId))));
}

async function upload(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  const file = (ctx.body as FormData).get('file') as File;
  const doc = await uploadForRequest(demand.id, ctx.params['requestId'], file, actor.username);
  return ok(await mapDocument(doc));
}

async function download(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireClient(ctx);
  const demand = await resolveDemand(ctx.params['demandId']);
  await assertClientApprovedForDemand(demand, actor.username);
  const d = await downloadFulfilled(demand.id, ctx.params['requestId']);
  return ok(new Blob([d.bytes as unknown as BlobPart], { type: d.contentType }));
}

export const clientDocumentRequestRoutes = [
  { method: 'GET', pattern: '/me/demands/:demandId/document-requests', handler: list },
  { method: 'POST', pattern: '/me/demands/:demandId/document-requests/:requestId/documents', handler: upload },
  { method: 'GET', pattern: '/me/demands/:demandId/document-requests/:requestId/documents/download', handler: download },
];
