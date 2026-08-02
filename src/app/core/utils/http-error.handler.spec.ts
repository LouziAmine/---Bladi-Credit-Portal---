import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { handleHttpError } from './http-error.handler';

describe('handleHttpError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log the error and rethrow it when not in production', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    await expect(firstValueFrom(handleHttpError('SomeService', 'someOp', false)(error))).rejects.toBe(error);
    expect(consoleSpy).toHaveBeenCalledWith('[SomeService] someOp failed:', error.message);
  });

  it('should rethrow the error without logging in production', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    await expect(firstValueFrom(handleHttpError('SomeService', 'someOp', true)(error))).rejects.toBe(error);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
