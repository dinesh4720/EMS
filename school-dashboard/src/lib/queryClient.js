import { QueryClient } from '@tanstack/react-query';

function shouldRetryRequest(failureCount, error) {
  const status = error?.status;

  if (status >= 400 && status < 500 && status !== 429) {
    return false;
  }

  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: shouldRetryRequest,
    },
    mutations: {
      retry: shouldRetryRequest,
    },
  },
});
