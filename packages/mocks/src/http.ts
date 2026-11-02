import {
  API_PREFIX,
  VENDOR_ROLES,
  type Paginated,
  type Role,
  type User,
  type Vendor,
} from '@mitdrone/types';
import { decodeJwt, isJwtExpired, sleep } from '@mitdrone/utils';
import { http, HttpResponse } from 'msw';

import { mockConfig } from './config';
import { getDb } from './db';

import type { ZodType, ZodTypeDef } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Resource'): ApiError =>
  new ApiError(404, 'not_found', `${what} not found`);

export interface Ctx {
  request: Request;
  params: Record<string, string>;
  url: URL;
}
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
type Resolver = (ctx: Ctx) => unknown | Promise<unknown>;

/** Latency plus failure injection. Per request: `x-mock-delay: 2000`, `x-mock-error: 503`. */
async function simulate(request: Request): Promise<void> {
  const delayHeader = Number(request.headers.get('x-mock-delay'));
  if (delayHeader > 0) await sleep(delayHeader);
  else if (mockConfig.latency) {
    const { min, max } = mockConfig.latency;
    await sleep(min + Math.random() * (max - min));
  }
  const forced = Number(request.headers.get('x-mock-error'));
  if (forced >= 400) throw new ApiError(forced, 'simulated_error', `Simulated ${forced} error`);
  if (mockConfig.errorRate > 0 && Math.random() < mockConfig.errorRate) {
    throw new ApiError(500, 'simulated_error', 'Simulated server error');
  }
}

/** Registers a handler for `${anyOrigin}${API_PREFIX}${path}`. Return data, a Response, or throw ApiError. */
export function route(method: Method, path: string, resolver: Resolver) {
  return http[method](`*${API_PREFIX}${path}`, async ({ request, params }) => {
    try {
      await simulate(request);
      const out = await resolver({
        request,
        url: new URL(request.url),
        params: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      });
      if (out instanceof Response) return out;
      if (out === undefined) return new HttpResponse(null, { status: 204 });
      return HttpResponse.json(out as Record<string, unknown>);
    } catch (error) {
      if (error instanceof ApiError) {
        return HttpResponse.json(
          {
            code: error.code,
            message: error.message,
            status: error.status,
            fieldErrors: error.fieldErrors,
          },
          { status: error.status },
        );
      }
      throw error;
    }
  });
}

export function created(body: unknown): Response {
  return HttpResponse.json(body as Record<string, unknown>, { status: 201 });
}

/* ------------------------------------------------------------------ body */

export async function readBody<T>(
  request: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(
      422,
      'validation_error',
      'Some fields are invalid',
      result.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return result.data;
}

/* ------------------------------------------------------------ pagination */

export function paginate<T>(items: T[], url: URL, defaultSize = 20): Paginated<T> {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('pageSize')) || defaultSize),
  );
  const total = items.length;
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export const includesText = (haystack: string[], q: string | null): boolean =>
  !q || haystack.some((h) => h.toLowerCase().includes(q.toLowerCase()));

/* ------------------------------------------------------------------ auth */

export function currentUser(request: Request): User | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const payload = decodeJwt<{ sub: string; type: string }>(token);
  if (!payload || payload.type !== 'access') return null;
  if (isJwtExpired(token)) throw new ApiError(401, 'token_expired', 'Access token expired');
  return getDb().users.find((u) => u.id === payload.sub) ?? null;
}

export function requireUser(request: Request, roles?: readonly Role[]): User {
  const user = currentUser(request);
  if (!user) throw new ApiError(401, 'unauthenticated', 'Sign in to continue');
  if (user.status === 'suspended')
    throw new ApiError(403, 'account_suspended', 'This account is suspended');
  if (roles && !roles.includes(user.role))
    throw new ApiError(403, 'forbidden', 'You do not have access to this resource');
  return user;
}

/** Enforces vendor scoping: :vendorId must equal the signed-in user's vendorId. */
export function requireVendor(ctx: Ctx, ownerOnly = false): { user: User; vendor: Vendor } {
  const user = requireUser(ctx.request, ownerOnly ? ['vendor_owner'] : VENDOR_ROLES);
  const vendorId = ctx.params['vendorId'];
  if (!vendorId || user.vendorId !== vendorId) {
    throw new ApiError(403, 'vendor_scope_violation', 'You can only access your own vendor data');
  }
  const vendor = getDb().vendors.find((v) => v.id === vendorId);
  if (!vendor) throw notFound('Vendor');
  return { user, vendor };
}

export const ADMIN_WRITE: readonly Role[] = ['admin', 'super_admin'];
