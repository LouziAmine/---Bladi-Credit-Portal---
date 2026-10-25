import { ApiError } from '../../core/models/api-error.model';

export interface DemoResult {
  status: number;
  body?: unknown;
}

export function ok<T>(body: T): DemoResult {
  return { status: 200, body };
}

export function created<T>(body: T): DemoResult {
  return { status: 201, body };
}

export function noContent(): DemoResult {
  return { status: 204 };
}

export class DemoHttpError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string,
    readonly description: string,
  ) {
    super(description);
    this.name = 'DemoHttpError';
  }

  toApiError(): ApiError {
    return {
      requestId: cryptoRandomId(),
      timestamp: new Date().toISOString(),
      errorCode: this.errorCode,
      description: this.description,
    };
  }
}

export function badRequest(description: string, errorCode = 'CB-400'): DemoHttpError {
  return new DemoHttpError(400, errorCode, description);
}

export function unauthorized(description = 'Invalid username or password.', errorCode = 'CB-401'): DemoHttpError {
  return new DemoHttpError(401, errorCode, description);
}

export function forbidden(description = 'Access denied.', errorCode = 'CB-403'): DemoHttpError {
  return new DemoHttpError(403, errorCode, description);
}

export function notFound(description = 'Resource not found.', errorCode = 'CB-404'): DemoHttpError {
  return new DemoHttpError(404, errorCode, description);
}

export function conflict(description: string, errorCode = 'CB-409'): DemoHttpError {
  return new DemoHttpError(409, errorCode, description);
}

export function unprocessable(description: string, errorCode = 'CB-422'): DemoHttpError {
  return new DemoHttpError(422, errorCode, description);
}

export function serviceUnavailable(description: string, errorCode = 'CB-503'): DemoHttpError {
  return new DemoHttpError(503, errorCode, description);
}

export function cryptoRandomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
