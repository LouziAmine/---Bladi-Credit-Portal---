export interface AuditLogEntry {
  id: number;
  username: string | null;
  action: string;
  ipAddress: string | null;
  details: string | null;
  performedAt: string;
}
