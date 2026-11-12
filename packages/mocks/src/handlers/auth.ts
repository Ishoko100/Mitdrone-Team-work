import {
  loginSchema,
  registerSchema,
  routes,
  type AuthResponse,
  type Customer,
  type RefreshRequest,
  type User,
} from '@mitdrone/types';
import { decodeJwt, isJwtExpired, slugify } from '@mitdrone/utils';
import { z } from 'zod';

import { getDb, nextId, passwordFor } from '../db';
import { ApiError, created, readBody, requireUser, route } from '../http';
import { isCustomer } from '../lib';
import { issueTokens } from '../tokens';

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const forgotSchema = z.object({ email: z.string().email() });

export const authHandlers = [
  route('post', routes.auth.login, async ({ request }) => {
    const { email, password } = await readBody(request, loginSchema);
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || passwordFor(email) !== password) {
      throw new ApiError(401, 'invalid_credentials', 'Incorrect email or password');
    }
    if (user.status === 'suspended')
      throw new ApiError(403, 'account_suspended', 'This account is suspended');
    user.lastLoginAt = new Date().toISOString();
    const body: AuthResponse = { user, tokens: issueTokens(user) };
    return body;
  }),

  route('post', routes.auth.register, async ({ request }) => {
    const input = await readBody(request, registerSchema);
    const db = getDb();
    const email = input.email.toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError(409, 'email_taken', 'An account with this email already exists', {
        email: ['Email already in use'],
      });
    }
    const now = new Date().toISOString();
    const base = {
      email,
      name: input.name,
      ...(input.phone ? { phone: input.phone } : {}),
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    let user: User;

    if (input.accountType === 'vendor') {
      const vId = nextId('ven');
      const uId = nextId('usr');
      db.vendors.push({
        id: vId,
        slug: slugify(`${input.name}-${vId}`),
        name:
          input.vendorType === 'service_provider'
            ? `${input.name}'s Services`
            : `${input.name}'s Store`,
        type: input.vendorType ?? 'individual_seller',
        status: 'draft',
        description: '',
        email,
        city: '',
        state: '',
        country: 'Nigeria',
        verified: false,
        rating: 0,
        reviewCount: 0,
        productCount: 0,
        commissionRate: db.settings.defaultCommissionRate,
        ownerId: uId,
        shipping: { handlingDays: 2, regions: ['Nationwide'] },
        returnPolicy: '',
        kycStatus: 'not_started',
        createdAt: now,
        updatedAt: now,
      });
      user = { ...base, id: uId, role: 'vendor_owner', status: 'pending', vendorId: vId };
    } else {
      const customer: Customer = {
        ...base,
        id: nextId('usr'),
        role: 'customer',
        status: 'active',
        addresses: [],
        referralCode:
          `${input.name.split(' ')[0] ?? 'MD'}${Math.floor(Math.random() * 90 + 10)}`.toUpperCase(),
      };
      const referrer = input.referralCode
        ? db.users.find(
            (u): u is Customer => isCustomer(u) && u.referralCode === input.referralCode,
          )
        : undefined;
      if (referrer) customer.referredBy = referrer.id;
      user = customer;
    }
    db.users.push(user);
    db.passwords[email] = input.password;
    const body: AuthResponse = { user, tokens: issueTokens(user) };
    return created(body);
  }),

  route('post', routes.auth.refresh, async ({ request }) => {
    const { refreshToken } = (await readBody(request, refreshSchema)) as RefreshRequest;
    const payload = decodeJwt<{ sub: string; type: string }>(refreshToken);
    if (!payload || payload.type !== 'refresh' || isJwtExpired(refreshToken)) {
      throw new ApiError(401, 'invalid_refresh_token', 'Session expired, please sign in again');
    }
    const user = getDb().users.find((u) => u.id === payload.sub);
    if (!user)
      throw new ApiError(401, 'invalid_refresh_token', 'Session expired, please sign in again');
    return { user, tokens: issueTokens(user) } satisfies AuthResponse;
  }),

  route('post', routes.auth.logout, () => undefined),

  route('post', routes.auth.forgotPassword, async ({ request }) => {
    await readBody(request, forgotSchema);
    return new Response(
      JSON.stringify({ message: 'If that email exists, a reset link has been sent.' }),
      { status: 202, headers: { 'content-type': 'application/json' } },
    );
  }),

  route('get', routes.auth.me, ({ request }) => requireUser(request)),
];
