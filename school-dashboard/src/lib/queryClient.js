import { QueryClient } from '@tanstack/react-query';

function shouldRetryRequest(failureCount, error) {
  const status = error?.status;

  if (status >= 400 && status < 500 && status !== 429) {
    return false;
  }

  return failureCount < 2;
}

// [AUDIT-850] Exponential backoff with jitter for retry delays.
// Gives the network time to recover after transient disconnects and
// avoids thundering herd when multiple requests fail simultaneously.
function retryDelay(failureCount, error) {
  const isRateLimit = error?.status === 429;
  // For 429s, honour the server's Retry-After if available; otherwise back off aggressively.
  const base = isRateLimit
    ? (error?.retryAfterMs ?? 5000)
    : Math.min(1000 * 2 ** failureCount, 10000); // 1 s → 2 s → 4 s … capped at 10 s
  // Add up to 20 % jitter to spread out concurrent retries.
  return base + base * 0.2 * Math.random();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      // [AUDIT-850] 'always' ensures errored queries (not just stale ones) are
      // automatically re-fetched when the network reconnects, so a transient
      // disconnect doesn't leave the page broken until a manual refresh.
      refetchOnReconnect: 'always',
      retry: shouldRetryRequest,
      retryDelay,
    },
    mutations: {
      retry: shouldRetryRequest,
      retryDelay,
    },
  },
});
