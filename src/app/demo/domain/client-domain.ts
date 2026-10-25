import { getAll, get, nextId, put } from '../core/demo-db';
import { conflict, cryptoRandomId, forbidden, notFound, unprocessable } from '../core/demo-result';
import { UserEntity } from '../core/entities';
import {
  ClientInvitationEntity,
  EnterpriseEntity,
  EnterpriseUserLinkEntity,
  MortgageBorrowerEntity,
} from '../core/client-entities';
import { EnterpriseLinkRole, EnterpriseLinkStatus } from '../../core/models/enterprise-user-link.model';
import { normalizeEnterpriseName } from './enterprise-name-normalizer';
import { createNotification } from './notifications';

const INVITATION_VALIDITY_DAYS = 7;

async function users(): Promise<UserEntity[]> {
  return getAll<UserEntity>('users');
}
export async function userById(id: number): Promise<UserEntity | undefined> {
  return (await users()).find((u) => u.id === id);
}
export async function userByUsername(username: string): Promise<UserEntity | undefined> {
  return (await users()).find((u) => u.username === username);
}
async function clientsByEmail(email: string): Promise<UserEntity[]> {
  const lc = email.toLowerCase();
  return (await users()).filter((u) => u.role === 'CLIENT' && (u.email ?? '').toLowerCase() === lc);
}

export async function createEnterprise(name: string, sector: string | null, registrationNumber: string | null): Promise<EnterpriseEntity> {
  const id = await nextId('enterprises');
  const entity: EnterpriseEntity = {
    id,
    publicId: cryptoRandomId(),
    name,
    normalizedName: normalizeEnterpriseName(name),
    sector: sector ?? null,
    registrationNumber: registrationNumber ?? null,
    rib: null,
    createdAt: new Date().toISOString(),
  };
  await put('enterprises', entity);
  return entity;
}

export async function listEnterprises(): Promise<EnterpriseEntity[]> {
  return (await getAll<EnterpriseEntity>('enterprises')).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function enterpriseByPublicId(publicId: string): Promise<EnterpriseEntity> {
  const e = (await getAll<EnterpriseEntity>('enterprises')).find((x) => x.publicId === publicId);
  if (!e) {
    throw notFound('Entreprise introuvable pour cet identifiant.');
  }
  return e;
}

export async function matchEnterpriseByName(rawName: string): Promise<EnterpriseEntity | null> {
  const normalized = normalizeEnterpriseName(rawName);
  if (!normalized) {
    return null;
  }
  const matches = (await getAll<EnterpriseEntity>('enterprises'))
    .filter((e) => e.normalizedName === normalized)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id - b.id));
  return matches[0] ?? null;
}

async function enterpriseByRegistrationNumber(registrationNumber: string): Promise<EnterpriseEntity | undefined> {
  return (await getAll<EnterpriseEntity>('enterprises')).find((e) => e.registrationNumber === registrationNumber);
}

async function allLinks(): Promise<EnterpriseUserLinkEntity[]> {
  return getAll<EnterpriseUserLinkEntity>('enterpriseUserLinks');
}

async function findActiveLink(enterpriseId: number, userId: number): Promise<EnterpriseUserLinkEntity | undefined> {
  return (await allLinks()).find(
    (l) => l.enterpriseId === enterpriseId && l.userId === userId && (l.status === 'PENDING' || l.status === 'APPROVED'),
  );
}

async function createLink(
  enterpriseId: number,
  userId: number,
  role: EnterpriseLinkRole,
  status: EnterpriseLinkStatus,
  origin: EnterpriseUserLinkEntity['origin'],
  claimedRegistrationNumber: string | null,
  requestedBy: string,
  decidedBy: string | null,
): Promise<EnterpriseUserLinkEntity> {
  const id = await nextId('enterpriseUserLinks');
  const now = new Date().toISOString();
  const link: EnterpriseUserLinkEntity = {
    id,
    publicId: cryptoRandomId(),
    enterpriseId,
    userId,
    role,
    status,
    origin,
    claimedRegistrationNumber,
    requestedByUsername: requestedBy,
    decidedByUsername: status === 'APPROVED' || status === 'REJECTED' ? decidedBy : null,
    decidedAt: status === 'APPROVED' || status === 'REJECTED' ? now : null,
    createdAt: now,
  };
  await put('enterpriseUserLinks', link);
  return link;
}

export async function inviteClient(enterpriseId: number, username: string, role: EnterpriseLinkRole, actor: string): Promise<EnterpriseUserLinkEntity> {
  await enterpriseByIdOrThrow(enterpriseId);
  const target = await userByUsername(username);
  if (!target) {
    throw notFound('Utilisateur introuvable.');
  }
  if (target.role !== 'CLIENT') {
    throw unprocessable("L'utilisateur cible n'a pas le rôle CLIENT.");
  }
  if (await findActiveLink(enterpriseId, target.id)) {
    throw conflict('Un lien actif (en attente ou approuvé) existe déjà pour cet utilisateur et cette entreprise.');
  }
  return createLink(enterpriseId, target.id, role, 'APPROVED', 'MANAGER_INVITE', null, actor, actor);
}

export async function claimEnterprise(registrationNumber: string, role: EnterpriseLinkRole, actor: string): Promise<EnterpriseUserLinkEntity> {
  const enterprise = await enterpriseByRegistrationNumber(registrationNumber);
  if (!enterprise) {
    throw notFound("Aucune entreprise trouvée pour ce numéro d'immatriculation.");
  }
  const requester = await userByUsername(actor);
  if (!requester) {
    throw notFound('Utilisateur introuvable.');
  }
  if (await findActiveLink(enterprise.id, requester.id)) {
    throw conflict('Un lien actif (en attente ou approuvé) existe déjà pour cet utilisateur et cette entreprise.');
  }
  const link = await createLink(enterprise.id, requester.id, role, 'PENDING', 'CLIENT_CLAIM', registrationNumber, actor, null);
  const managers = (await users()).filter((u) => u.role === 'MANAGER');
  for (const m of managers) {
    await createNotification(
      m.username,
      'ENTERPRISE_LINK_CLAIM_PENDING',
      'Demande de rattachement',
      `${actor} demande à être rattaché à l'entreprise ${enterprise.name}.`,
      '/admin/enterprise-links',
    );
  }
  return link;
}

async function linkByPublicId(publicId: string): Promise<EnterpriseUserLinkEntity> {
  const l = (await allLinks()).find((x) => x.publicId === publicId);
  if (!l) {
    throw notFound('Lien entreprise-utilisateur introuvable pour cet identifiant.');
  }
  return l;
}

export async function approveLink(publicId: string, actor: string): Promise<EnterpriseUserLinkEntity> {
  const link = await linkByPublicId(publicId);
  if (link.status !== 'PENDING') {
    throw conflict("Ce lien n'est pas en attente, il ne peut pas être approuvé ou rejeté.");
  }
  link.status = 'APPROVED';
  link.decidedByUsername = actor;
  link.decidedAt = new Date().toISOString();
  await put('enterpriseUserLinks', link);
  return link;
}

export async function rejectLink(publicId: string, actor: string): Promise<EnterpriseUserLinkEntity> {
  const link = await linkByPublicId(publicId);
  if (link.status !== 'PENDING') {
    throw conflict("Ce lien n'est pas en attente, il ne peut pas être approuvé ou rejeté.");
  }
  link.status = 'REJECTED';
  link.decidedByUsername = actor;
  link.decidedAt = new Date().toISOString();
  await put('enterpriseUserLinks', link);
  return link;
}

export async function revokeLink(publicId: string, actor: string): Promise<EnterpriseUserLinkEntity> {
  const link = await linkByPublicId(publicId);
  if (link.status !== 'APPROVED') {
    throw conflict("Ce lien n'est pas approuvé, il ne peut pas être révoqué.");
  }
  link.status = 'REVOKED';
  link.decidedByUsername = actor;
  link.decidedAt = new Date().toISOString();
  await put('enterpriseUserLinks', link);
  return link;
}

export async function linksByEnterprise(enterpriseId: number): Promise<EnterpriseUserLinkEntity[]> {
  return (await allLinks()).filter((l) => l.enterpriseId === enterpriseId).sort((a, b) => a.id - b.id);
}
export async function pendingLinks(): Promise<EnterpriseUserLinkEntity[]> {
  return (await allLinks()).filter((l) => l.status === 'PENDING').sort((a, b) => a.id - b.id);
}
export async function linksByUser(userId: number): Promise<EnterpriseUserLinkEntity[]> {
  return (await allLinks()).filter((l) => l.userId === userId).sort((a, b) => a.id - b.id);
}
export async function approvedLinksByUser(userId: number): Promise<EnterpriseUserLinkEntity[]> {
  return (await allLinks()).filter((l) => l.userId === userId && l.status === 'APPROVED').sort((a, b) => a.id - b.id);
}

export async function assertApprovedForEnterprise(userId: number, enterpriseId: number): Promise<void> {
  const approved = await approvedLinksByUser(userId);
  if (!approved.some((l) => l.enterpriseId === enterpriseId)) {
    throw forbidden("Vous n'avez pas de lien approuvé avec cette entreprise.");
  }
}

async function enterpriseByIdOrThrow(enterpriseId: number): Promise<EnterpriseEntity> {
  const e = await get<EnterpriseEntity>('enterprises', enterpriseId);
  if (!e) {
    throw notFound('Entreprise introuvable pour cet identifiant.');
  }
  return e;
}

export async function createInvitation(
  enterpriseId: number,
  email: string,
  role: EnterpriseLinkRole,
  demandId: number | null,
  createdBy: string,
): Promise<void> {
  const pending = (await getAll<ClientInvitationEntity>('invitations')).find(
    (i) => i.status === 'PENDING' && i.email.toLowerCase() === email.toLowerCase() && i.enterpriseId === enterpriseId,
  );
  if (pending) {
    return;
  }
  const id = await nextId('invitations');
  const now = Date.now();
  const invitation: ClientInvitationEntity = {
    id,
    token: cryptoRandomId(),
    email,
    enterpriseId,
    role,
    demandId,
    status: 'PENDING',
    createdByUsername: createdBy,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITATION_VALIDITY_DAYS * 86400000).toISOString(),
    acceptedAt: null,
  };
  await put('invitations', invitation);
}

export async function createBorrowerInvitation(demandId: number, email: string, createdBy: string): Promise<void> {
  const pending = (await getAll<ClientInvitationEntity>('invitations')).find(
    (i) => i.status === 'PENDING' && i.email.toLowerCase() === email.toLowerCase() && i.demandId === demandId && i.enterpriseId === null,
  );
  if (pending) {
    return;
  }
  const id = await nextId('invitations');
  const now = Date.now();
  const invitation: ClientInvitationEntity = {
    id,
    token: cryptoRandomId(),
    email,
    enterpriseId: null,
    role: null,
    demandId,
    status: 'PENDING',
    createdByUsername: createdBy,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITATION_VALIDITY_DAYS * 86400000).toISOString(),
    acceptedAt: null,
  };
  await put('invitations', invitation);
}

async function requirePendingInvitation(token: string): Promise<ClientInvitationEntity> {
  const inv = (await getAll<ClientInvitationEntity>('invitations')).find((i) => i.token === token);
  if (!inv || inv.status !== 'PENDING') {
    throw notFound('Aucune invitation en attente trouvée pour ce lien.');
  }
  if (new Date(inv.expiresAt).getTime() < Date.now()) {
    throw conflict('Cette invitation a expiré.');
  }
  return inv;
}

export interface InvitationPreview {
  email: string;
  enterpriseName: string | null;
  demandReference: string | null;
  expiresAt: string;
}

export async function previewInvitation(token: string, demandReferenceOf: (demandId: number) => Promise<string | null>): Promise<InvitationPreview> {
  const inv = await requirePendingInvitation(token);
  if (inv.enterpriseId === null) {

    return { email: inv.email, enterpriseName: null, demandReference: inv.demandId != null ? await demandReferenceOf(inv.demandId) : null, expiresAt: inv.expiresAt };
  }
  const enterprise = await enterpriseByIdOrThrow(inv.enterpriseId);
  return { email: inv.email, enterpriseName: enterprise.name, demandReference: null, expiresAt: inv.expiresAt };
}

export async function acceptInvitation(token: string, username: string, password: string): Promise<void> {
  const inv = await requirePendingInvitation(token);
  if (await userByUsername(username)) {
    throw conflict("Ce nom d'utilisateur est déjà utilisé.");
  }
  const id = await nextId('users');
  const client: UserEntity = {
    id,
    publicId: cryptoRandomId(),
    username,
    password,
    role: 'CLIENT',
    fullName: null,
    email: inv.email,
    gradeId: null,
    teamId: null,
  };
  await put('users', client);
  inv.status = 'ACCEPTED';
  inv.acceptedAt = new Date().toISOString();
  await put('invitations', inv);

  if (inv.enterpriseId === null && inv.demandId != null) {
    await linkBorrower(inv.demandId, client.id, 'EMAIL_INVITATION', inv.createdByUsername);
  } else if (inv.enterpriseId != null) {
    await createLink(inv.enterpriseId, client.id, inv.role ?? 'RESPONSABLE', 'APPROVED', 'EMAIL_INVITATION', null, username, inv.createdByUsername);
  }
}

async function linkBorrower(demandId: number, userId: number, origin: string, linkedBy: string): Promise<void> {
  const existing = await get<MortgageBorrowerEntity>('mortgageBorrowers', demandId);
  if (existing) {
    return;
  }
  const entity: MortgageBorrowerEntity = { id: demandId, demandId, userId, origin, linkedBy, linkedAt: new Date().toISOString() };
  await put('mortgageBorrowers', entity);
}

export async function borrowerDemandIds(userId: number): Promise<number[]> {
  return (await getAll<MortgageBorrowerEntity>('mortgageBorrowers')).filter((b) => b.userId === userId).map((b) => b.demandId);
}

export async function isBorrower(demandId: number, userId: number): Promise<boolean> {
  const b = await get<MortgageBorrowerEntity>('mortgageBorrowers', demandId);
  return !!b && b.userId === userId;
}

export async function resolveClientForClassification(enterpriseId: number, contactEmail: string | null, demandId: number, actor: string): Promise<void> {
  if (!contactEmail || !contactEmail.trim()) {
    return;
  }
  const matches = await clientsByEmail(contactEmail);
  if (matches.length === 1) {
    const client = matches[0];
    if (await findActiveLink(enterpriseId, client.id)) {
      return;
    }
    await createLink(enterpriseId, client.id, 'RESPONSABLE', 'APPROVED', 'AUTO_MATCHED_ON_CLASSIFICATION', null, actor, actor);
  } else if (matches.length === 0) {
    await createInvitation(enterpriseId, contactEmail, 'RESPONSABLE', demandId, actor);
  }

}

export async function resolveBorrowerForClassification(demandId: number, contactEmail: string | null, actor: string): Promise<void> {
  if (!contactEmail || !contactEmail.trim()) {
    return;
  }
  if (await get<MortgageBorrowerEntity>('mortgageBorrowers', demandId)) {
    return;
  }
  const matches = await clientsByEmail(contactEmail);
  if (matches.length === 1) {
    await linkBorrower(demandId, matches[0].id, 'AUTO_MATCHED_ON_CLASSIFICATION', actor);
  } else if (matches.length === 0) {
    await createBorrowerInvitation(demandId, contactEmail, actor);
  }
}
