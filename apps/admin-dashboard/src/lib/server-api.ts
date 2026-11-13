import 'server-only';

import { MOCK_CSRF_TOKEN, setMockConfig } from '@mitdrone/mocks';
import { mockFetch } from '@mitdrone/mocks/fetch';
import { api, configureApiClient } from '@mitdrone/sdk';

/**
 * Server Components fetch through the same SDK. In mock mode the SDK is given a fetch that calls
 * the mock handlers in-process, so no network, port or global patching is involved. That makes it
 * work identically in `next dev`, `next build` and `next start`.
 */
export async function serverApi(): Promise<typeof api> {
  // server-only: configure in-process mock fetch unless explicitly disabled.
  // Defaults to mocks so SSR works with zero config; set NEXT_PUBLIC_ENABLE_MOCKS=false
  // to call the real API at NEXT_PUBLIC_API_URL.
  if (process.env.NEXT_PUBLIC_ENABLE_MOCKS !== 'false') {
    setMockConfig({ latency: false });
    configureApiClient({
      fetch: mockFetch,
      getCsrfToken: () => MOCK_CSRF_TOKEN,
    });
  }
  return api;
}
