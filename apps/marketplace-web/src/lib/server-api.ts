import 'server-only';

import { api, configureApiClient } from '@mitdrone/sdk';

import { env } from '@/lib/env';

export const REVALIDATE_SECONDS = 60;

/**
 * Server Components fetch through the same SDK. In mock mode the SDK is given a fetch that calls
 * the mock handlers in-process, so no network, port or global patching is involved. That makes it
 * work identically in `next dev`, `next build` and `next start`.
 */
export async function serverApi(): Promise<typeof api> {
  if (env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
    const [{ mockFetch }, { setMockConfig }] = await Promise.all([
      import('@mitdrone/mocks/fetch'),
      import('@mitdrone/mocks'),
    ]);
    setMockConfig({ latency: false });
    configureApiClient({ fetch: mockFetch });
  }
  return api;
}
