import { EnterpriseType } from './investment-credit.model';

export type EnterpriseLinkStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export type EnterpriseLinkOrigin =
  | 'MANAGER_INVITE'
  | 'CLIENT_CLAIM'
  | 'AUTO_MATCHED_ON_CLASSIFICATION'
  | 'EMAIL_INVITATION';

export const ENTERPRISE_LINK_ROLE_OPTIONS = ['RESPONSABLE', 'DELEGUE'] as const;
export type EnterpriseLinkRole = (typeof ENTERPRISE_LINK_ROLE_OPTIONS)[number];

export interface EnterpriseUserLinkResponse {
  id: string;
  enterpriseId: string;
  userId: string;
  role: EnterpriseLinkRole;
  status: EnterpriseLinkStatus;
  origin: EnterpriseLinkOrigin;
  requestedByUsername: string;
  decidedByUsername: string | null;
  decidedAt: string | null;
  createdAt: string;
  username: string | null;
}

export interface InviteEnterpriseLinkRequest {
  username: string;
  role: EnterpriseLinkRole;
}

export interface ClaimEnterpriseLinkRequest {
  registrationNumber: string;
  role: EnterpriseLinkRole;
}

export interface RejectEnterpriseLinkRequest {
  reason?: string;
}

export interface ClientPortfolioEnterpriseResponse {
  enterpriseId: string;
  name: string;
  sector: string | null;
  linkRole: EnterpriseLinkRole;
}

export interface ClientDemandSummaryResponse {
  id: string;
  reference: string;
  enterpriseType: EnterpriseType | null;
  amount: number | null;
  duration: number | null;
  applicableRate: number | null;
  createdAt: string;
  completedAt: string | null;
  completed: boolean;
  rejected: boolean;
}
