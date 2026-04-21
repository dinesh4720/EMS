/**
 * Request Queue Manager
 * Handles rate limiting and request batching to prevent 429 errors
 */

class RequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 4; // Max concurrent requests
    this.minDelay = options.minDelay || 150; // Min delay between requests (ms)
    this.rateLimitCooldownMs = options.rateLimitCooldownMs || 5000;
    this.queue = [];
    this.activeRequests = 0;
    this.lastRequestTime = 0;
    this.cooldownUntil = 0;
    this.cooldownTimer = null;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    if (now < this.cooldownUntil) {
      const remainingCooldown = this.cooldownUntil - now;

      if (!this.cooldownTimer) {
        this.cooldownTimer = setTimeout(() => {
          this.cooldownTimer = null;
          this.processQueue();
        }, remainingCooldown);
      }

      return;
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      setTimeout(() => this.processQueue(), this.minDelay - timeSinceLastRequest);
      return;
    }

    const { requestFn, resolve, reject } = this.queue.shift();
    this.activeRequests++;
    this.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      if (isRateLimitError(error)) {
        this.applyRateLimitCooldown(getRateLimitDelayMs(error, this.rateLimitCooldownMs));
      }
      reject(error);
    } finally {
      this.activeRequests--;
      // Process next item in queue
      setTimeout(() => this.processQueue(), this.minDelay);
    }
  }

  applyRateLimitCooldown(delayMs = this.rateLimitCooldownMs) {
    const cooldownMs = Math.max(delayMs, this.minDelay);
    const nextCooldownUntil = Date.now() + cooldownMs;

    if (nextCooldownUntil <= this.cooldownUntil) {
      return;
    }

    this.cooldownUntil = nextCooldownUntil;

    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  clear() {
    const error = new DOMException('Request queue cleared', 'AbortError');
    for (const { reject } of this.queue) {
      reject(error);
    }
    this.queue = [];
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  get pending() {
    return this.queue.length;
  }

  get active() {
    return this.activeRequests;
  }
}

// Create a global request queue instance
export const requestQueue = new RequestQueue({
  maxConcurrent: 4,
  minDelay: 150,
  rateLimitCooldownMs: 5000,
});

function isRateLimitError(error) {
  return (
    error?.status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.includes('Too many requests')
  );
}

function getRateLimitDelayMs(error, fallbackDelay) {
  if (typeof error?.retryAfterMs === 'number' && Number.isFinite(error.retryAfterMs)) {
    return error.retryAfterMs;
  }

  if (typeof error?.retryAfter === 'number' && Number.isFinite(error.retryAfter)) {
    return error.retryAfter * 1000;
  }

  return fallbackDelay;
}

/**
 * Batch multiple requests with delay.
 * Accepts an array of functions that return promises (not already-executing promises).
 * Each batch of functions is invoked together, then awaited via Promise.allSettled.
 */
export async function batchRequests(requestFns, batchSize = 5, delayMs = 200) {
  const results = [];

  for (let i = 0; i < requestFns.length; i += batchSize) {
    const batch = requestFns.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn => fn()));
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < requestFns.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Retry a request with exponential backoff
 */
export async function retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on abort/cancellation
      if (error.name === 'AbortError') {
        throw error;
      }

      // Don't retry on certain errors (client errors except rate limits)
      if (
        (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) ||
        error.message?.includes('401') ||
        error.message?.includes('403') ||
        error.message?.includes('404') ||
        error.message?.includes('not found')
      ) {
        throw error;
      }

      // If it's a 429 (rate limit), wait MUCH longer
      const isRateLimit = error.message?.includes('429') || error.message?.includes('Too many requests');

      if (attempt < maxRetries) {
        const delay = isRateLimit
          ? getRateLimitDelayMs(error, baseDelay * Math.pow(3, attempt) * 5)
          : baseDelay * Math.pow(2, attempt);

        if (isRateLimit) {
          requestQueue.applyRateLimitCooldown(delay);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function for repeated calls.
 * Returns a promise that resolves with the function's return value.
 * Supports cancellation via `.cancel()`.
 */
export function debounce(func, wait) {
  let timeout;
  let pendingResolve;
  let pendingReject;

  function debounced(...args) {
    clearTimeout(timeout);

    return new Promise((resolve, reject) => {
      pendingResolve = resolve;
      pendingReject = reject;
      timeout = setTimeout(() => {
        pendingResolve = null;
        pendingReject = null;
        try {
          resolve(func(...args));
        } catch (err) {
          reject(err);
        }
      }, wait);
    });
  }

  debounced.cancel = () => {
    clearTimeout(timeout);
    if (pendingReject) {
      pendingReject(new DOMException('Debounce cancelled', 'AbortError'));
      pendingResolve = null;
      pendingReject = null;
    }
  };

  return debounced;
}

