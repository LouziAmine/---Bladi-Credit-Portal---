import { getAll } from '../core/demo-db';
import { DemoContext, requireManager } from '../core/demo-context';
import { DemoResult, notFound, ok } from '../core/demo-result';
import { DemandDocumentEntity, DemandEntity } from '../core/workflow-entities';
import { DemandDocumentResponse } from '../../core/models/document.model';
import { downloadDocument, inspectFile, listDocuments, recordDocument } from '../domain/document-domain';

async function resolveDemand(publicId: string): Promise<DemandEntity> {
  const d = (await getAll<DemandEntity>('demands')).find((x) => x.publicId === publicId);
  if (!d) {
    throw notFound('Dossier introuvable pour cet identifiant.');
  }
  return d;
}

export async function mapDocument(doc: DemandDocumentEntity): Promise<DemandDocumentResponse> {
  let supersededBy: string | null = null;
  if (doc.supersededByDocumentId != null) {
    const target = (await getAll<DemandDocumentEntity>('documents')).find((d) => d.id === doc.supersededByDocumentId);
    supersededBy = target?.publicId ?? null;
  }
  return {
    id: doc.publicId,
    stepCode: doc.stepCode,
    stepName: doc.stepName,
    originalFilename: doc.originalFilename,
    contentType: doc.contentType,
    sizeBytes: doc.sizeBytes,
    checksumSha256: doc.checksumSha256,
    documentType: doc.documentType,
    status: doc.status,
    scanStatus: doc.scanStatus,
    supersededByDocumentId: supersededBy,
    uploadedBy: doc.uploadedBy,
    uploadedAt: doc.uploadedAt,
  };
}

function fileFromBody(body: unknown): { file: File; documentType: string | null } {
  const form = body as FormData;
  const file = form.get('file') as File;
  const documentType = (form.get('documentType') as string | null) ?? null;
  return { file, documentType };
}

async function upload(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const demand = await resolveDemand(ctx.params['id']);
  const { file, documentType } = fileFromBody(ctx.body);
  const inspected = await inspectFile(file);
  const doc = await recordDocument(demand.id, inspected, documentType, actor.username);
  return ok(await mapDocument(doc));
}

async function list(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['id']);
  const docs = await listDocuments(demand.id);
  return ok(await Promise.all(docs.map(mapDocument)));
}

async function download(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const demand = await resolveDemand(ctx.params['id']);
  const d = await downloadDocument(demand.id, ctx.params['documentId']);
  return ok(new Blob([d.bytes as unknown as BlobPart], { type: d.contentType }));
}

export const documentRoutes = [
  { method: 'POST', pattern: '/demands/:id/documents', handler: upload },
  { method: 'GET', pattern: '/demands/:id/documents', handler: list },
  { method: 'GET', pattern: '/demands/:id/documents/:documentId/download', handler: download },
];
