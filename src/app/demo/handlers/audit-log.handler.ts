import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { DemoResult, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { AuditLogEntry } from '../../core/models/audit-log.model';
import { auditEntries } from '../domain/audit';

async function getAuditLog(ctx: DemoContext): Promise<DemoResult> {
  requireManager(ctx);
  const entityType = ctx.query.get('entityType');
  const entityId = ctx.query.get('entityId');
  let entries = await auditEntries();
  if (entityType) {
    entries = entries.filter((e) => e.entityType === entityType);
  }
  if (entityId) {
    entries = entries.filter((e) => e.entityId === entityId);
  }
  const mapped: AuditLogEntry[] = entries.map((e) => ({
    id: e.publicId,
    username: e.username,
    action: e.action,
    ipAddress: e.ipAddress,
    details: e.details,
    performedAt: e.performedAt,
    entityType: e.entityType,
    entityId: e.entityId,
  }));
  return ok(paginate(mapped, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

export const auditLogRoutes = [{ method: 'GET', pattern: '/audit-log', handler: getAuditLog }];
