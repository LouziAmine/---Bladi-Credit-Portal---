import { DemoContext, queryInt, requireManager } from '../core/demo-context';
import { DemoResult, noContent, ok } from '../core/demo-result';
import { paginate } from '../core/demo-page';
import { NotificationEntry } from '../../core/models/notification.model';
import { markAllRead, markRead, notificationsOf, unreadCountOf } from '../domain/notifications';

async function getMy(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  const all = (await notificationsOf(actor.username)).map(
    (n): NotificationEntry => ({ id: n.publicId, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt }),
  );
  return ok(paginate(all, queryInt(ctx, 'page', 1), queryInt(ctx, 'size', 20)));
}

async function unreadCount(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  return ok(await unreadCountOf(actor.username));
}

async function read(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  await markRead(ctx.params['id'], actor.username);
  return noContent();
}

async function readAll(ctx: DemoContext): Promise<DemoResult> {
  const actor = requireManager(ctx);
  await markAllRead(actor.username);
  return noContent();
}

export const notificationRoutes = [
  { method: 'GET', pattern: '/notifications', handler: getMy },
  { method: 'GET', pattern: '/notifications/unread-count', handler: unreadCount },
  { method: 'PATCH', pattern: '/notifications/:id/read', handler: read },
  { method: 'PATCH', pattern: '/notifications/read-all', handler: readAll },
];
