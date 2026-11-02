import { getResponse } from 'msw';

import { handlers } from './handlers';

/**
 * A `fetch` that answers straight from the mock handlers, with no global patching.
 * Use it for server-side rendering: Next.js re-patches `globalThis.fetch` as routes compile in
 * dev, which silently drops interceptors installed by `setupServer`. Calling the handlers
 * directly is deterministic in dev, build and production.
 */
export const mockFetch: typeof fetch = async (input, init) => {
  const request = new Request(input as RequestInfo, init);
  const response = await getResponse(handlers, request);
  if (!response) throw new TypeError(`No mock handler for ${request.method} ${request.url}`);
  return response;
};
