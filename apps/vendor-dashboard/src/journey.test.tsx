import { AuthController } from '@mitdrone/auth';
import { describe, expect, it } from 'vitest';

import { setupMockApi } from './test-utils';

setupMockApi();

describe('vendor registration boundary', () => {
  it('does not create an authenticated vendor session from email registration alone', async () => {
    const controller = new AuthController({
      allowedRoles: ['vendor_owner', 'vendor_staff'],
    });

    await controller.register({
      email: 'tola@example.com',
      acceptedTerms: true,
      termsVersion: 'v1',
      fullName: 'Tola Bakare',
      phone: '08031234567',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(controller.getSnapshot().status).toBe('loading');
    await controller.restore();
    expect(controller.getSnapshot().status).toBe('unauthenticated');
  });
});
