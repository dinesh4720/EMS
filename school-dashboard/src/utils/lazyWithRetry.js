import { lazy } from 'react';

/**
 * Wraps React.lazy() with retry logic for failed chunk loads.
 * On transient network errors, retries up to `maxRetries` times.
 * On final failure after all retries, forces a page reload once
 * (avoids infinite reload loops via sessionStorage flag).
 */
export default function lazyWithRetry(importFn, maxRetries = 2) {
  return lazy(() => retryImport(importFn, maxRetries));
}

function retryImport(importFn, retriesLeft) {
  return importFn().catch((error) => {
    // Only retry for network/chunk load errors — not for runtime errors like WebGL crashes
    if (retriesLeft > 0 && isChunkError(error)) {
      return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
        retryImport(importFn, retriesLeft - 1)
      );
    }

    // All retries exhausted — attempt one-time page reload for stale chunks
    if (isChunkError(error)) {
      const reloadKey = 'chunk_reload_' + window.location.pathname;
      try {
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          window.location.reload();
          // Return a never-resolving promise so React doesn't render an error
          // before the reload takes effect
          return new Promise(() => {});
        }
        // Already tried reloading — clear flag and let error propagate to ErrorBoundary
        sessionStorage.removeItem(reloadKey);
      } catch (_) {
        // sessionStorage unavailable (private browsing) — skip reload strategy
      }
    }

    // Wrap non-Error values so ErrorBoundary receives a proper Error instance
    // (prevents "[object Object]" flooding the console)
    throw error instanceof Error ? error : new Error(String(error ?? 'Unknown import error'));
  });
}

export function isChunkError(error) {
  const msg = error?.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    error?.name === 'ChunkLoadError'
  );
}
