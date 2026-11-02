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
  /** Token interceptor: return the current access token, if any. */
  getAccessToken?: (() => string | null | undefined) | undefined;
  /** Called once (single-flight) on a 401 to get a fresh access token. Return null if the session is over. */
  refreshAccessToken?: (() => Promise<string | null>) | undefined;
  /** Called when a 401 cannot be recovered. Clear the session and redirect to login. */
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
  private refreshing: Promise<string | null> | null = null;

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
    const url = `${this.config.baseUrl.replace(/\/$/, '')}${buildPath(pattern, options.params)}${toQueryString(options.query)}`;
    const useAuth = options.auth !== false;
    const token = useAuth ? (this.config.getAccessToken?.() ?? null) : null;

    let response = await this.send(method, url, options, token);

    if (response.status === 401 && useAuth && token) {
      const body = (await readJson(response.clone())) as Partial<ApiErrorBody> | undefined;
      if (body?.code === 'token_expired' || body?.code === 'unauthenticated') {
        // Another request may have refreshed while this one was in flight: reuse that token.
        const latest = this.config.getAccessToken?.() ?? null;
        const fresh = latest && latest !== token ? latest : await this.refreshOnce();
        if (fresh) response = await this.send(method, url, options, fresh);
        else this.config.onAuthFailure?.();
      }
    }
    return this.parse<T>(response);
  }

  private refreshOnce(): Promise<string | null> {
    const refresh = this.config.refreshAccessToken;
    if (!refresh) return Promise.resolve(null);
    this.refreshing ??= refresh()
      .catch(() => null)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  private async send(
    method: Method,
    url: string,
    options: RequestOptions,
    token: string | null,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const init: RequestInit & { next?: RequestOptions['next'] } = {
      method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.next ? { next: options.next } : {}),
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
    const raw = (body ?? {}) as Partial<ApiErrorBody>;
    const error = new ApiClientError({
      status: raw.status ?? response.status,
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
