import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** Node server for Vitest and for SSR/ISR fetches (start it in Next's instrumentation.ts). */
export const server = setupServer(...handlers);
