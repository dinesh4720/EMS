import { describe, it, expect, vi } from 'vitest';
import { parseApiError } from './apiError';

function mockResponse(body, status = 400) {
  return {
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('parseApiError', () => {
  it('uses body.error as message when present', async () => {
    const res = mockResponse({ error: 'Validation failed' }, 422);
    const err = await parseApiError(res);
    expect(err.message).toBe('Validation failed');
    expect(err.status).toBe(422);
  });

  it('uses body.message as fallback', async () => {
    const res = mockResponse({ message: 'Not found' }, 404);
    const err = await parseApiError(res);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
  });

  it('falls back to status message when body has no error/message', async () => {
    const res = mockResponse({}, 500);
    const err = await parseApiError(res);
    expect(err.message).toBe('Request failed with status 500');
    expect(err.status).toBe(500);
  });

  it('attaches details from body.details', async () => {
    const details = { field: 'email', issue: 'invalid' };
    const res = mockResponse({ error: 'Bad request', details }, 400);
    const err = await parseApiError(res);
    expect(err.details).toEqual(details);
  });

  it('attaches whole body as details when no body.details', async () => {
    const body = { message: 'Server error' };
    const res = mockResponse(body, 500);
    const err = await parseApiError(res);
    expect(err.details).toEqual(body);
  });

  it('handles JSON parse failure gracefully', async () => {
    const res = {
      status: 503,
      json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
    };
    const err = await parseApiError(res);
    expect(err.message).toBe('Request failed with status 503');
    expect(err.status).toBe(503);
  });

  it('returns an Error instance', async () => {
    const res = mockResponse({ error: 'test' }, 400);
    const err = await parseApiError(res);
    expect(err).toBeInstanceOf(Error);
  });
});
