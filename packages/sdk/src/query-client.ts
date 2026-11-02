import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './errors';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Never retry client errors (4xx). Retry network and 5xx failures twice.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/** Server: a new client per request. Browser: a singleton, so React suspense cannot discard the cache. */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
