export type AuditEntityType = 'DEMAND' | 'ENTERPRISE' | 'USER';

export interface AuditLogEntry {
  id: string;
  username: string | null;
  action: string;
  ipAddress: string | null;
  details: string | null;
  performedAt: string;
  entityType: AuditEntityType | null;
  entityId: string | null;
}
