import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchRequests, retryRequest, debounce } from './requestQueue';

// ─── batchRequests ────────────────────────────────────────────────────────────

describe('batchRequests', () => {
  it('returns results for all requests', async () => {
    const requestFns = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ];
    const results = await batchRequests(requestFns, 3, 0);
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({ status: 'fulfilled', value: 1 });
  });

  it('captures rejections without throwing', async () => {
    const requestFns = [
      () => Promise.resolve('ok'),
      () => Promise.reject(new Error('boom')),
    ];
    const results = await batchRequests(requestFns, 2, 0);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[1].reason.message).toBe('boom');
  });

  it('processes requests in batches of the given size', async () => {
    // 5 requests, batch size 2 → we expect all 5 results
    const requestFns = Array.from({ length: 5 }, (_, i) => () => Promise.resolve(i));
    const results = await batchRequests(requestFns, 2, 0);
    expect(results).toHaveLength(5);
  });

  it('only invokes functions within the current batch', async () => {
    const callOrder = [];
    const requestFns = [
      () => { callOrder.push(0); return Promise.resolve(0); },
      () => { callOrder.push(1); return Promise.resolve(1); },
      () => { callOrder.push(2); return Promise.resolve(2); },
      () => { callOrder.push(3); return Promise.resolve(3); },
    ];
    await batchRequests(requestFns, 2, 0);
    // All 4 should be called, but in batch order (0,1 before 2,3)
    expect(callOrder).toEqual([0, 1, 2, 3]);
  });

  it('returns fulfilled results in order', async () => {
    const requestFns = [
      () => Promise.resolve('a'),
      () => Promise.resolve('b'),
      () => Promise.resolve('c'),
    ];
    const results = await batchRequests(requestFns, 3, 0);
    const values = results.map(r => r.value);
    expect(values).toEqual(['a', 'b', 'c']);
  });

  it('handles an empty request array', async () => {
    const results = await batchRequests([], 5, 0);
    expect(results).toEqual([]);
  });
});

// ─── retryRequest ─────────────────────────────────────────────────────────────

describe('retryRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('resolves immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('data');
    const promise = retryRequest(fn, 3, 0);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('data');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue('success');
    const promise = retryRequest(fn, 3, 0);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxRetries exhausted', async () => {
    const err = new Error('persistent');
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retryRequest(fn, 2, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('persistent');
    expect(fn).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries
  });

  it('does not retry on AbortError', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    const fn = vi.fn().mockRejectedValue(abortErr);
    const promise = retryRequest(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 401 errors', async () => {
    const err = new Error('Unauthorized');
    err.status = 401;
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retryRequest(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 404 errors', async () => {
    const err = new Error('Not found');
    err.status = 404;
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retryRequest(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 403 errors', async () => {
    const err = new Error('Forbidden');
    err.status = 403;
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retryRequest(fn, 3, 0);
    promise.catch(() => {}); // suppress unhandled rejection warning
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ─── debounce ─────────────────────────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('delays the function call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced('arg');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledWith('arg');
  });

  it('only calls once for rapid successive calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the latest arguments to the function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('first');
    debounced('last');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('last');
  });

  it('resets the timer on each call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(99);
    debounced(); // resets
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows calling again after the wait period', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns a promise that resolves with the function return value', async () => {
    const fn = vi.fn(() => 42);
    const debounced = debounce(fn, 100);
    const promise = debounced();
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBe(42);
  });

  it('cancel() prevents the pending call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    const promise = debounced();
    promise.catch(() => {}); // suppress expected rejection
    debounced.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel() rejects the pending promise with AbortError', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    const promise = debounced();
    debounced.cancel();
    await expect(promise).rejects.toThrow('Debounce cancelled');
  });

  it('only the latest call resolves when superseded', async () => {
    const fn = vi.fn(() => 'final');
    const debounced = debounce(fn, 100);
    debounced(); // superseded — promise never settles
    const second = debounced();
    vi.advanceTimersByTime(100);
    await expect(second).resolves.toBe('final');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
