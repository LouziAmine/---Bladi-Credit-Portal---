import { getAll, nextId, put } from '../core/demo-db';
import { cryptoRandomId } from '../core/demo-result';
import { NotificationEntity } from '../core/workflow-entities';

export async function createNotification(
  username: string,
  type: string,
  title: string,
  body: string,
  link: string | null,
): Promise<void> {
  const id = await nextId('notifications');
  const n: NotificationEntity = {
    id,
    publicId: cryptoRandomId(),
    username,
    type,
    title,
    body,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await put('notifications', n);
}

export async function notificationsOf(username: string): Promise<NotificationEntity[]> {
  return (await getAll<NotificationEntity>('notifications'))
    .filter((n) => n.username === username)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id));
}

export async function unreadCountOf(username: string): Promise<number> {
  return (await getAll<NotificationEntity>('notifications')).filter((n) => n.username === username && !n.read).length;
}

export async function markRead(publicId: string, username: string): Promise<void> {
  const all = await getAll<NotificationEntity>('notifications');
  const n = all.find((x) => x.publicId === publicId && x.username === username);
  if (n && !n.read) {
    n.read = true;
    await put('notifications', n);
  }
}

export async function markAllRead(username: string): Promise<void> {
  const all = (await getAll<NotificationEntity>('notifications')).filter((n) => n.username === username && !n.read);
  for (const n of all) {
    n.read = true;
    await put('notifications', n);
  }
}
