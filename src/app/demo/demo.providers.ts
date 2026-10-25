import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { from, Observable, of, switchMap, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const DEMO_LATENCY_MS = 160;

if (environment.demo && typeof window !== 'undefined' && 'EventSource' in window) {
  const NativeEventSource = window.EventSource;
  class DemoEventSource extends EventTarget {
    readonly url: string;
    readyState = 0;
    onopen: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    constructor(url: string | URL) {
      super();
      this.url = String(url);
    }
    close(): void {
      this.readyState = 2;
    }
  }
  window.EventSource = new Proxy(NativeEventSource, {
    construct(target, args: [string | URL, (EventSourceInit | undefined)?]) {
      const url = String(args[0] ?? '');
      if (url.includes('/api/v1')) {
        return new DemoEventSource(args[0]) as unknown as EventSource;
      }
      return Reflect.construct(target, args) as EventSource;
    },
  });
}

export const demoBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demo) {
    return next(req);
  }

  if (!req.url.includes('/api/v1')) {
    return next(req);
  }

  return from(import('./fake-backend')).pipe(
    switchMap((m) => from(m.handleDemo(req.method, req.urlWithParams, req.body))),
    delay(DEMO_LATENCY_MS),
    switchMap((outcome): Observable<HttpResponse<unknown>> => {
      if (outcome.isError) {
        return throwError(
          () =>
            new HttpErrorResponse({
              url: req.url,
              status: outcome.status,
              statusText: statusText(outcome.status),
              error: outcome.body,
            }),
        );
      }
      return of(
        new HttpResponse({
          url: req.url,
          status: outcome.status,
          statusText: statusText(outcome.status),
          body: outcome.body ?? null,
        }),
      );
    }),
  );
};

function statusText(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Content',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return map[status] ?? 'Unknown';
}
