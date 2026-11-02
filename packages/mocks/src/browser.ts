import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** Browser worker. Requires `public/mockServiceWorker.js` (run `npx msw init public`). */
export const worker = setupWorker(...handlers);
