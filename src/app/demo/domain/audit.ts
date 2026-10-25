import { getAll, nextId, put } from '../core/demo-db';
import { cryptoRandomId } from '../core/demo-result';
import { AuditLogEntity } from '../core/workflow-entities';

const ACTIONS: Record<string, string> = {
  'POST /auth/login': 'LOGIN',
  'POST /auth/logout': 'LOGOUT',
  'POST /auth/register': 'REGISTER',
  'POST /mortgage-credit': 'SIMULATION',
  'POST /investment-credit': 'ENTERPRISE_SIMULATION',
  'POST /demands/:id/advance': 'DEMAND_ADVANCED',
  'POST /demands/:id/classify': 'DEMAND_CLASSIFIED',
  'POST /demands/:id/assign': 'DEMAND_ASSIGNED',
  'POST /demands/:id/comments': 'DEMAND_COMMENTED',
  'POST /demands/:id/documents': 'DEMAND_DOCUMENT_UPLOADED',
  'POST /demands/:id/document-requests': 'DOCUMENT_REQUEST_CREATED',
  'POST /demands/:demandId/credit-file/installments/:installmentId/payments/validate': 'PAYMENT_VALIDATED',
  'POST /demands/:demandId/credit-file/installments/:installmentId/payments/reject': 'PAYMENT_REJECTED',
  'POST /me/demands/:demandId/credit-file/installments/:installmentId/payments': 'PAYMENT_DECLARED',
  'POST /demands/:demandId/credit-file/early-repayments': 'EARLY_REPAYMENT',
  'POST /me/demands/:demandId/document-requests/:requestId/documents': 'DOCUMENT_REQUEST_FULFILLED',
  'PATCH /credit-rates/:id': 'CREDIT_RATE_UPDATE',
  'PATCH /bam-parameters/:id': 'BAM_PARAMETERS_UPDATE',
  'PATCH /mourabaha-parameters/:id': 'MOURABAHA_PARAMETERS_UPDATE',
  'PATCH /investment-credit-parameters/:id': 'INVESTMENT_PARAMETERS_UPDATE',
  'POST /enterprises': 'ENTERPRISE_CREATE',
  'POST /enterprises/:enterpriseId/user-links': 'ENTERPRISE_USER_LINK_INVITED',
  'POST /me/enterprise-links': 'ENTERPRISE_USER_LINK_CLAIMED',
  'PATCH /enterprise-user-links/:linkId/approve': 'ENTERPRISE_USER_LINK_APPROVED',
  'PATCH /enterprise-user-links/:linkId/reject': 'ENTERPRISE_USER_LINK_REJECTED',
  'PATCH /enterprise-user-links/:linkId/revoke': 'ENTERPRISE_USER_LINK_REVOKED',
  'POST /users': 'USER_CREATE',
  'PATCH /users/:id/role': 'USER_ROLE_UPDATE',
  'PATCH /users/:id/profile': 'USER_PROFILE_UPDATE',
  'POST /activity-sectors': 'ACTIVITY_SECTOR_CREATE',
  'POST /document-suggestions': 'DOCUMENT_SUGGESTION_CREATE',
  'DELETE /document-suggestions/:id': 'DOCUMENT_SUGGESTION_DELETE',
  'POST /mock/verification-bam': 'BAM_VERIFICATION_MOCK_RUN',
  'POST /invitations/:token/accept': 'CLIENT_INVITATION_ACCEPTED',
};

function entityTypeFor(pattern: string): AuditLogEntity['entityType'] {
  if (pattern.includes('/demands')) {
    return 'DEMAND';
  }
  if (pattern.includes('/enterprise')) {
    return 'ENTERPRISE';
  }
  if (pattern.includes('/users')) {
    return 'USER';
  }
  return null;
}

export async function recordAudit(method: string, pattern: string, path: string, username: string | null): Promise<void> {
  const key = `${method} ${pattern}`;
  const action = ACTIONS[key];
  if (!action) {
    return;
  }
  const id = await nextId('auditLog');
  const entry: AuditLogEntity = {
    id,
    publicId: cryptoRandomId(),
    username,
    action,
    ipAddress: '127.0.0.1',
    details: path,
    performedAt: new Date().toISOString(),
    entityType: entityTypeFor(pattern),
    entityId: null,
  };
  await put('auditLog', entry);
}

export async function auditEntries(): Promise<AuditLogEntity[]> {
  return (await getAll<AuditLogEntity>('auditLog')).sort((a, b) => (a.performedAt < b.performedAt ? 1 : a.performedAt > b.performedAt ? -1 : b.id - a.id));
}
