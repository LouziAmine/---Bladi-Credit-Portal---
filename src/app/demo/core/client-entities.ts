import { EnterpriseLinkOrigin, EnterpriseLinkRole, EnterpriseLinkStatus } from '../../core/models/enterprise-user-link.model';

export interface EnterpriseEntity {
  id: number;
  publicId: string;
  name: string;
  normalizedName: string;
  sector: string | null;
  registrationNumber: string | null;
  rib: string | null;
  createdAt: string;
}

export interface EnterpriseUserLinkEntity {
  id: number;
  publicId: string;
  enterpriseId: number;
  userId: number;
  role: EnterpriseLinkRole;
  status: EnterpriseLinkStatus;
  origin: EnterpriseLinkOrigin;
  claimedRegistrationNumber: string | null;
  requestedByUsername: string;
  decidedByUsername: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface ClientInvitationEntity {
  id: number;

  token: string;
  email: string;
  enterpriseId: number | null;
  role: EnterpriseLinkRole | null;
  demandId: number | null;
  status: InvitationStatus;
  createdByUsername: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface MortgageBorrowerEntity {
  id: number;
  demandId: number;
  userId: number;
  origin: string;
  linkedBy: string | null;
  linkedAt: string;
}
