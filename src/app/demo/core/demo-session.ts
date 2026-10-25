import { getMeta, setMeta } from './demo-db';

export interface DemoSession {
  userId: number;
  username: string;
  role: 'MANAGER' | 'CLIENT';
}

const SESSION_KEY = 'session';

export function getSession(): Promise<DemoSession | undefined> {
  return getMeta<DemoSession>(SESSION_KEY);
}

export function setSession(session: DemoSession): Promise<void> {
  return setMeta(SESSION_KEY, session);
}

export function clearSession(): Promise<void> {
  return setMeta(SESSION_KEY, null);
}
