import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** Type-safe, validated env. Defaults let the app run with zero configuration. */
export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
    NEXT_PUBLIC_ENABLE_MOCKS: z.enum(['true', 'false']).default('true'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default('pk_test_mitdrone_mock'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_VENDOR_URL: z.string().url().default('http://localhost:3001'),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_MOCKS: process.env.NEXT_PUBLIC_ENABLE_MOCKS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VENDOR_URL: process.env.NEXT_PUBLIC_VENDOR_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
