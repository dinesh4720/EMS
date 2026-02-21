/**
 * Request Queue Manager
 * Handles rate limiting and request batching to prevent 429 errors
 */

class RequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5; // Max concurrent requests
    this.minDelay = options.minDelay || 50; // Min delay between requests (ms)
    this.queue = [];
    this.activeRequests = 0;
    this.lastRequestTime = 0;
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

    // Enforce minimum delay between requests
    const now = Date.now();
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
      reject(error);
    } finally {
      this.activeRequests--;
      // Process next item in queue
      setTimeout(() => this.processQueue(), this.minDelay);
    }
  }

  clear() {
    this.queue = [];
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
  maxConcurrent: 15, // Increased from 5 to 15 for better parallelism
  minDelay: 20, // Reduced from 100ms to 20ms for faster requests
});

/**
 * Batch multiple requests with delay
 */
export async function batchRequests(requests, batchSize = 5, delayMs = 200) {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
    
    // Add delay between batches (except for the last batch)
    if (i + batchSize < requests.length) {
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

      // Don't retry on certain errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error;
      }

      // If it's a 429 (rate limit), wait MUCH longer
      const isRateLimit = error.message?.includes('429') || error.message?.includes('Too many requests');

      if (attempt < maxRetries) {
        const delay = isRateLimit
          ? baseDelay * Math.pow(3, attempt) * 5 // Much longer backoff for rate limits (5s, 15s, 45s)
          : baseDelay * Math.pow(2, attempt);

        console.log(`⏳ Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function for repeated calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Cache for request results
 */
class RequestCache {
  constructor(ttl = 60000) { // Default 1 minute TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const requestCache = new RequestCache(30000); // 30 second cache
