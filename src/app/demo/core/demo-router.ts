import { DemoContext } from './demo-context';
import { DemoHttpError, DemoResult, cryptoRandomId } from './demo-result';
import { getSession } from './demo-session';
import { ApiError } from '../../core/models/api-error.model';

export type DemoHandler = (ctx: DemoContext) => DemoResult | Promise<DemoResult>;

export interface DemoRoute {
  method: string;

  pattern: string;
  handler: DemoHandler;
  segments: string[];
}

const routes: DemoRoute[] = [];

export function registerRoutes(defs: { method: string; pattern: string; handler: DemoHandler }[]): void {
  for (const d of defs) {
    routes.push({ ...d, segments: splitPath(d.pattern) });
  }
}

function splitPath(path: string): string[] {
  return path.replace(/^\//, '').replace(/\/$/, '').split('/').filter(Boolean);
}

function matchRoute(method: string, path: string): { route: DemoRoute; params: Record<string, string> } | null {
  const reqSegments = splitPath(path);
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }
    if (route.segments.length !== reqSegments.length) {
      continue;
    }
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < route.segments.length; i++) {
      const pat = route.segments[i];
      const seg = reqSegments[i];
      if (pat.startsWith(':')) {
        params[pat.slice(1)] = decodeURIComponent(seg);
      } else if (pat !== seg) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return { route, params };
    }
  }
  return null;
}

function parseUrl(url: string): { path: string; query: URLSearchParams } {
  let rest = url;
  const schemeIdx = rest.indexOf('://');
  if (schemeIdx >= 0) {
    const slash = rest.indexOf('/', schemeIdx + 3);
    rest = slash >= 0 ? rest.slice(slash) : '/';
  }
  let queryString = '';
  const qIdx = rest.indexOf('?');
  if (qIdx >= 0) {
    queryString = rest.slice(qIdx + 1);
    rest = rest.slice(0, qIdx);
  }
  const apiIdx = rest.indexOf('/api/v1');
  const path = apiIdx >= 0 ? rest.slice(apiIdx + '/api/v1'.length) || '/' : rest;
  return { path, query: new URLSearchParams(queryString) };
}

export interface DispatchOutcome {
  status: number;
  body?: unknown;
  isError: boolean;
}

export async function dispatch(method: string, url: string, body: unknown): Promise<DispatchOutcome> {
  const { path, query } = parseUrl(url);
  const match = matchRoute(method, path);
  if (!match) {
    const api: ApiError = {
      requestId: cryptoRandomId(),
      timestamp: new Date().toISOString(),
      errorCode: 'CB-404',
      description: `No demo handler for ${method} ${path}`,
    };
    return { status: 404, body: api, isError: true };
  }

  const session = await getSession();
  const ctx: DemoContext = {
    method,
    path,
    params: match.params,
    query,
    body,
    session: session ?? undefined,
  };

  try {
    const result = await match.route.handler(ctx);

    if (method !== 'GET' && result.status < 400) {
      try {
        const { recordAudit } = await import('../domain/audit');
        const after = await getSession();
        await recordAudit(method, match.route.pattern, path, after?.username ?? session?.username ?? null);
      } catch {
        void 0;
      }
    }
    return { status: result.status, body: result.body, isError: false };
  } catch (err) {
    if (err instanceof DemoHttpError) {
      return { status: err.status, body: err.toApiError(), isError: true };
    }
    const api: ApiError = {
      requestId: cryptoRandomId(),
      timestamp: new Date().toISOString(),
      errorCode: 'CB-500',
      description: err instanceof Error ? err.message : 'Internal demo error',
    };
    console.error('[demo] handler error', method, path, err);
    return { status: 500, body: api, isError: true };
  }
}
