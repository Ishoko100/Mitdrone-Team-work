import { buildPath, type ApiErrorBody } from '@mitdrone/types';
import { buildQueryString } from '@mitdrone/utils';

import { ApiClientError } from './errors';

export const DEFAULT_API_URL = 'http://localhost:4000/api/v1';

function envBaseUrl(): string {
  try {
    return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export interface ClientConfig {
  baseUrl: string;
  /** Optional legacy bearer token hook for mock/demo API calls only. */
  getAccessToken?: (() => string | null | undefined) | undefined;
  /** Supplies the backend-issued CSRF token; its acquisition mechanism is backend-defined. */
  getCsrfToken?: (() => string | null | undefined | Promise<string | null | undefined>) | undefined;
  /** Called when an authenticated request receives a 401. */
  onAuthFailure?: (() => void) | undefined;
  /** Error interceptor hook, for global logging or toasts. */
  onError?: ((error: ApiClientError) => void) | undefined;
  fetch?: typeof fetch | undefined;
}

export interface RequestOptions {
  params?: Record<string, string> | undefined;
  query?: object | undefined;
  body?: unknown;
  signal?: AbortSignal | undefined;
  headers?: Record<string, string> | undefined;
  /** Set false for public endpoints such as login. Default true. */
  auth?: boolean | undefined;
  /** Override CSRF behavior. Authenticated mutations require a token by default. */
  csrf?: boolean | undefined;
  /** Override the base URL for this request (e.g. health endpoints outside /api/v1). */
  baseUrlOverride?: string | undefined;
  /** Next.js fetch caching for Server Components (ISR). */
  next?: { revalidate?: number | false; tags?: string[] } | undefined;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function toQueryString(query: object | undefined): string {
  if (!query) return '';
  const flat: Record<string, string | number | boolean | null | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (
      ['string', 'number', 'boolean'].includes(typeof value) ||
      value === null ||
      value === undefined
    ) {
      flat[key] = value as string | number | boolean | null | undefined;
    }
  }
  return buildQueryString(flat);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export class ApiClient {
  private config: ClientConfig;

  constructor(config: Partial<ClientConfig> = {}) {
    this.config = { baseUrl: envBaseUrl(), ...config };
  }

  configure(partial: Partial<ClientConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  async request<T>(method: Method, pattern: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl = options.baseUrlOverride ?? this.config.baseUrl;
    const url = `${baseUrl.replace(/\/$/, '')}${buildPath(pattern, options.params)}${toQueryString(options.query)}`;
    const useAuth = options.auth !== false;
    const token = useAuth ? (this.config.getAccessToken?.() ?? null) : null;
    const requireCsrf = options.csrf ?? (useAuth && method !== 'GET');
    let response: Response;
    try {
      response = await this.send(method, url, options, token, requireCsrf);
    } catch (error) {
      if (error instanceof ApiClientError) this.config.onError?.(error);
      throw error;
    }
    if (response.status === 401 && useAuth) this.config.onAuthFailure?.();
    return this.parse<T>(response);
  }

  private async send(
    method: Method,
    url: string,
    options: RequestOptions,
    token: string | null,
    requireCsrf: boolean,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
    if (requireCsrf) {
      const csrfToken = await this.config.getCsrfToken?.();
      if (!csrfToken) {
        throw new ApiClientError({
          status: 403,
          code: 'csrf_token_unavailable',
          message:
            'This request requires a CSRF token, but the backend has not documented how to obtain one.',
        });
      }
      headers['x-csrf-token'] = csrfToken;
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const init: RequestInit & { next?: RequestOptions['next'] } = {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: isFormData ? (options.body as FormData) : JSON.stringify(options.body) }
        : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.next ? { next: options.next } : {}),
      credentials: 'include',
    };
    try {
      return await (this.config.fetch ?? fetch)(url, init);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      const failure = new ApiClientError({
        status: 0,
        code: 'network_error',
        message: 'Network error. Check your connection and try again.',
      });
      this.config.onError?.(failure);
      throw failure;
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    const body = await readJson(response);
    if (response.ok) return body as T;
    const outer = (body ?? {}) as Partial<ApiErrorBody> & {
      error?: { code?: string; message?: string; fieldErrors?: Record<string, string[]> };
    };
    const raw = outer.error ?? outer;
    const error = new ApiClientError({
      status: outer.status ?? response.status,
      code: raw.code ?? 'unknown_error',
      message: raw.message ?? `Request failed with status ${response.status}`,
      fieldErrors: raw.fieldErrors,
    });
    this.config.onError?.(error);
    throw error;
  }
}

/** Shared client used by `api` and every hook. Apps/auth configure it once at startup. */
export const apiClient = new ApiClient();

export function configureApiClient(partial: Partial<ClientConfig>): void {
  apiClient.configure(partial);
}
