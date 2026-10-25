import { DemoSession, getSession } from './demo-session';
import { forbidden, unauthorized } from './demo-result';

export interface DemoContext {
  method: string;

  path: string;

  params: Record<string, string>;

  query: URLSearchParams;

  body: unknown;
  session?: DemoSession;
}

export function requireAuth(ctx: DemoContext): DemoSession {
  if (!ctx.session) {
    throw unauthorized('Authentication required.');
  }
  return ctx.session;
}

export function requireManager(ctx: DemoContext): DemoSession {
  const s = requireAuth(ctx);
  if (s.role !== 'MANAGER') {
    throw forbidden('Manager role required.');
  }
  return s;
}

export function requireClient(ctx: DemoContext): DemoSession {
  const s = requireAuth(ctx);
  if (s.role !== 'CLIENT') {
    throw forbidden('Client role required.');
  }
  return s;
}

export function pathParamNumber(ctx: DemoContext, name: string): number {
  const raw = ctx.params[name];
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid numeric path param ${name}: ${raw}`);
  }
  return n;
}

export function queryInt(ctx: DemoContext, name: string, fallback: number): number {
  const raw = ctx.query.get(name);
  if (raw === null || raw === '') {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export { getSession };
