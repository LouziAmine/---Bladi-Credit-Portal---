import { getAll, nextId, put } from '../core/demo-db';
import { conflict, cryptoRandomId, forbidden, notFound, unprocessable } from '../core/demo-result';
import { DemandDocumentEntity, DemandEntity, DocumentRequestEntity, StepInfo, StepInstanceEntity } from '../core/workflow-entities';
import { findOpenStepInstance, findStepInstances, getDemand, stepInfoByWpsId } from './workflow-repo';
import { approvedLinksByUser, isBorrower } from './client-domain';
import { createNotification } from './notifications';
import { userByUsername } from './client-domain';

const MAX_FILE_SIZE_BYTES = 15728640;
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeFilename(name: string | null | undefined): string {
  if (!name || !name.trim()) {
    return 'document';
  }
  const normalized = name.replace(/\\/g, '/');
  const base = normalized.substring(normalized.lastIndexOf('/') + 1);
  return base.length > 255 ? base.substring(0, 255) : base;
}

async function currentStepInfo(demandId: number): Promise<StepInfo> {
  const open = await findOpenStepInstance(demandId);
  let instance: StepInstanceEntity | undefined = open;
  if (!instance) {
    const all = await findStepInstances(demandId);
    instance = all[all.length - 1];
  }
  const info = instance ? await stepInfoByWpsId(instance.workflowProcessStepId) : null;
  if (!info) {
    throw notFound('Étape de circuit introuvable pour ce dossier.');
  }
  return info;
}

export interface InspectedFile {
  originalFilename: string;
  contentType: string;
  contentBase64: string;
  checksum: string;
  sizeBytes: number;
  scanStatus: 'CLEAN' | 'SKIPPED';
}

export async function inspectFile(file: File): Promise<InspectedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_FILE_SIZE_BYTES) {
    throw unprocessable('Ce fichier dépasse la taille maximale autorisée pour le téléversement.');
  }
  const contentType = file.type;
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw unprocessable("Ce type de fichier n'est pas autorisé. Types autorisés : PDF, JPEG, PNG, DOCX, XLSX.");
  }
  return {
    originalFilename: sanitizeFilename(file.name),
    contentType,
    contentBase64: bytesToBase64(bytes),
    checksum: await sha256Hex(bytes),
    sizeBytes: bytes.length,
    scanStatus: 'SKIPPED',
  };
}

export async function recordDocument(demandId: number, inspected: InspectedFile, documentType: string | null, actor: string): Promise<DemandDocumentEntity> {
  const step = await currentStepInfo(demandId);
  const id = await nextId('documents');
  const doc: DemandDocumentEntity = {
    id,
    publicId: cryptoRandomId(),
    demandId,
    stepCode: step.stepCode,
    stepName: step.stepName,
    originalFilename: inspected.originalFilename,
    contentType: inspected.contentType,
    sizeBytes: inspected.sizeBytes,
    checksumSha256: inspected.checksum,
    documentType: documentType && documentType.trim() ? documentType : null,
    status: 'ACTIVE',
    scanStatus: inspected.scanStatus,
    supersededByDocumentId: null,
    uploadedBy: actor,
    uploadedAt: new Date().toISOString(),
    contentBase64: inspected.contentBase64,
  };
  await put('documents', doc);

  if (doc.documentType) {
    const existing = (await getAll<DemandDocumentEntity>('documents')).find(
      (d) => d.demandId === demandId && d.documentType === doc.documentType && d.status === 'ACTIVE' && d.id !== doc.id,
    );
    if (existing) {
      existing.status = 'SUPERSEDED';
      existing.supersededByDocumentId = doc.id;
      await put('documents', existing);
    }
  }
  return doc;
}

export async function listDocuments(demandId: number): Promise<DemandDocumentEntity[]> {
  return (await getAll<DemandDocumentEntity>('documents')).filter((d) => d.demandId === demandId).sort((a, b) => a.id - b.id);
}

export interface Downloadable {
  contentType: string;
  originalFilename: string;
  bytes: Uint8Array;
}

export async function downloadDocument(demandId: number, documentPublicId: string): Promise<Downloadable> {
  const doc = (await getAll<DemandDocumentEntity>('documents')).find((d) => d.demandId === demandId && d.publicId === documentPublicId);
  if (!doc) {
    throw notFound('Document introuvable pour cet identifiant sur ce dossier.');
  }
  if (doc.scanStatus !== 'CLEAN' && doc.scanStatus !== 'SKIPPED') {
    throw conflict("Ce document n'a pas encore terminé son analyse antivirus et ne peut pas être téléchargé.");
  }
  return { contentType: doc.contentType, originalFilename: doc.originalFilename, bytes: base64ToBytes(doc.contentBase64) };
}

export async function createRequest(demandId: number, documentType: string, actor: string): Promise<DocumentRequestEntity> {
  const id = await nextId('documentRequests');
  const req: DocumentRequestEntity = {
    id,
    publicId: cryptoRandomId(),
    demandId,
    documentType,
    status: 'PENDING',
    requestedByUsername: actor,
    createdAt: new Date().toISOString(),
    fulfilledDocumentId: null,
    fulfilledAt: null,
  };
  await put('documentRequests', req);
  return req;
}

export async function listRequests(demandId: number): Promise<DocumentRequestEntity[]> {
  return (await getAll<DocumentRequestEntity>('documentRequests')).filter((r) => r.demandId === demandId).sort((a, b) => a.id - b.id);
}

async function requireRequestForDemand(demandId: number, requestPublicId: string): Promise<DocumentRequestEntity> {
  const req = (await getAll<DocumentRequestEntity>('documentRequests')).find((r) => r.publicId === requestPublicId);
  if (!req) {
    throw notFound('Demande de document introuvable pour cet identifiant.');
  }
  if (req.demandId !== demandId) {
    throw forbidden("Cette demande de document n'appartient pas à ce dossier.");
  }
  return req;
}

export async function uploadForRequest(demandId: number, requestPublicId: string, file: File, actor: string): Promise<DemandDocumentEntity> {
  const req = await requireRequestForDemand(demandId, requestPublicId);
  const inspected = await inspectFile(file);
  const uploaded = await recordDocument(demandId, inspected, req.documentType, actor);
  req.status = 'FULFILLED';
  req.fulfilledDocumentId = uploaded.id;
  req.fulfilledAt = new Date().toISOString();
  await put('documentRequests', req);

  const demand = await getDemand(demandId);
  if (demand) {
    await createNotification(
      req.requestedByUsername,
      'DOCUMENT_REQUEST_FULFILLED',
      'Document reçu',
      `Le document « ${req.documentType} » a été fourni pour le dossier ${demand.reference}.`,
      `/admin/demands/${demand.publicId}`,
    );
  }
  return uploaded;
}

export async function downloadFulfilled(demandId: number, requestPublicId: string): Promise<Downloadable> {
  const req = await requireRequestForDemand(demandId, requestPublicId);
  if (req.fulfilledDocumentId == null) {
    throw conflict("Cette demande de document n'a pas encore été satisfaite.");
  }
  const doc = (await getAll<DemandDocumentEntity>('documents')).find((d) => d.id === req.fulfilledDocumentId);
  if (!doc) {
    throw notFound('Document introuvable pour cet identifiant sur ce dossier.');
  }
  return { contentType: doc.contentType, originalFilename: doc.originalFilename, bytes: base64ToBytes(doc.contentBase64) };
}

export async function assertClientApprovedForDemand(demand: DemandEntity, username: string): Promise<void> {
  const user = await userByUsername(username);
  if (!user) {
    throw forbidden('Vous n’avez pas accès à ce dossier.');
  }
  if (demand.demandType === 'MORTGAGE') {
    if (!(await isBorrower(demand.id, user.id))) {
      throw forbidden('Vous n’avez pas accès à ce dossier.');
    }
  } else {
    const enterpriseId = demand.enterpriseDetail?.enterpriseId ?? null;
    const approved = await approvedLinksByUser(user.id);
    if (enterpriseId == null || !approved.some((l) => l.enterpriseId === enterpriseId)) {
      throw forbidden("Vous n'avez pas de lien approuvé avec cette entreprise.");
    }
  }
}
