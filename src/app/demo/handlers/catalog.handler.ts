import { getAll, nextId, put, remove } from '../core/demo-db';
import { DemoContext, requireAuth, requireManager } from '../core/demo-context';
import { badRequest, conflict, created, cryptoRandomId, DemoResult, noContent, notFound, ok } from '../core/demo-result';
import { ActivitySectorEntity, DocumentSuggestionEntity, EnterpriseType } from '../core/entities';
import { ActivitySectorResponse, CreateActivitySectorRequest } from '../../core/models/activity-sector.model';
import { CreateDocumentSuggestionRequest, DocumentSuggestionResponse } from '../../core/models/document-suggestion.model';

function toSector(e: ActivitySectorEntity): ActivitySectorResponse {
  return { id: e.publicId, name: e.name, createdAt: e.createdAt };
}

async function listSectors(): Promise<DemoResult> {

  const all = (await getAll<ActivitySectorEntity>('activitySectors')).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return ok<ActivitySectorResponse[]>(all.map(toSector));
}

async function createSector(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const { name } = (ctx.body ?? {}) as CreateActivitySectorRequest;
  const all = await getAll<ActivitySectorEntity>('activitySectors');
  if (all.some((s) => s.name.toLowerCase() === (name ?? '').toLowerCase())) {
    throw conflict("Un secteur d'activité portant ce nom existe déjà.");
  }
  const id = await nextId('activitySectors');
  const entity: ActivitySectorEntity = { id, publicId: cryptoRandomId(), name, createdAt: new Date().toISOString() };
  await put('activitySectors', entity);
  return created<ActivitySectorResponse>(toSector(entity));
}

function toSuggestion(e: DocumentSuggestionEntity): DocumentSuggestionResponse {
  return {
    id: e.publicId,
    enterpriseType: e.enterpriseType,
    cspCode: e.cspCode as DocumentSuggestionResponse['cspCode'],
    label: e.label,
    createdAt: e.createdAt,
  };
}

async function listSuggestions(ctx: DemoContext): Promise<DemoResult> {
  requireAuth(ctx);
  const enterpriseType = ctx.query.get('enterpriseType') as EnterpriseType | null;
  const cspCode = ctx.query.get('cspCode');
  let all = await getAll<DocumentSuggestionEntity>('documentSuggestions');

  if (cspCode) {
    all = all.filter((s) => s.clientScope === 'CSP' && (s.cspCode === cspCode || s.cspCode === null));
  } else if (enterpriseType) {
    all = all.filter((s) => s.clientScope === 'ENTERPRISE' && (s.enterpriseType === enterpriseType || s.enterpriseType === null));
  }
  all.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  return ok<DocumentSuggestionResponse[]>(all.map(toSuggestion));
}

async function createSuggestion(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const body = (ctx.body ?? {}) as CreateDocumentSuggestionRequest;
  const enterpriseType = (body.enterpriseType ?? null) as EnterpriseType | null;
  const cspCode = body.cspCode ?? null;
  const label = body.label;

  if (enterpriseType !== null && cspCode !== null) {
    throw badRequest("Une suggestion s'applique soit à un type d'entreprise, soit à un profil CSP, pas aux deux.");
  }
  const all = await getAll<DocumentSuggestionEntity>('documentSuggestions');
  const labelLc = (label ?? '').toLowerCase();
  const duplicate = cspCode !== null
    ? all.some((s) => s.cspCode === cspCode && s.label.toLowerCase() === labelLc)
    : all.some((s) => s.enterpriseType === enterpriseType && s.label.toLowerCase() === labelLc);
  if (duplicate) {
    throw conflict("Une suggestion de document portant ce nom existe déjà pour ce type d'entreprise.");
  }

  const id = await nextId('documentSuggestions');
  const entity: DocumentSuggestionEntity = {
    id,
    publicId: cryptoRandomId(),
    enterpriseType,
    cspCode,
    label,
    createdAt: new Date().toISOString(),
    clientScope: cspCode !== null ? 'CSP' : 'ENTERPRISE',
  };
  await put('documentSuggestions', entity);
  return created<DocumentSuggestionResponse>(toSuggestion(entity));
}

async function deleteSuggestion(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const all = await getAll<DocumentSuggestionEntity>('documentSuggestions');
  const found = all.find((s) => s.publicId === ctx.params['id']);
  if (!found) {
    throw notFound('Suggestion de document introuvable.');
  }
  await remove('documentSuggestions', found.id);
  return noContent();
}

export const catalogRoutes = [
  { method: 'GET', pattern: '/activity-sectors', handler: listSectors },
  { method: 'POST', pattern: '/activity-sectors', handler: createSector },
  { method: 'GET', pattern: '/document-suggestions', handler: listSuggestions },
  { method: 'POST', pattern: '/document-suggestions', handler: createSuggestion },
  { method: 'DELETE', pattern: '/document-suggestions/:id', handler: deleteSuggestion },
];
