import { api, ApiClientError, configureApiClient, isApiError } from '@mitdrone/sdk';

import type { LoginRequest, RegisterRequest, Role, User } from '@mitdrone/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

export interface AuthControllerOptions {
  /** @deprecated Cookie sessions are shared according to backend cookie scope. */
  storageKey?: string;
  /** Enables the mock server's in-memory bearer token compatibility. Never enable for production. */
  mockMode?: boolean;
  /** Roles allowed to sign in to this app. */
  allowedRoles?: readonly Role[];
  /** Called when the backend session is no longer valid. */
  onSessionExpired?: () => void;
}

const SERVER_STATE: AuthState = { status: 'loading', user: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    typeof value.role === 'string' &&
    typeof value.status === 'string' &&
    typeof value.emailVerified === 'boolean'
  );
}

function sessionUser(payload: unknown): User {
  const candidate = isRecord(payload) && 'user' in payload ? payload.user : payload;
  if (!isUser(candidate)) {
    throw new ApiClientError({
      status: 502,
      code: 'invalid_session_response',
      message: 'The backend session response does not contain a supported user record.',
    });
  }
  return candidate;
}

/** Cookie-backed session manager. The HTTP-only session cookie is never read by JavaScript. */
export class AuthController {
  private state: AuthState = { status: 'loading', user: null };
  private listeners = new Set<() => void>();
  private readonly allowedRoles: readonly Role[] | undefined;
  private readonly onSessionExpired: (() => void) | undefined;
  private readonly mockMode: boolean;
  private mockAccessToken: string | null = null;
  private restoring: Promise<void> | null = null;

  constructor(options: AuthControllerOptions = {}) {
    this.allowedRoles = options.allowedRoles;
    this.onSessionExpired = options.onSessionExpired;
    this.mockMode = options.mockMode ?? false;
  }

  bindApiClient(): void {
    configureApiClient({
      onAuthFailure: () => this.expire(),
      ...(this.mockMode ? { getAccessToken: () => this.mockAccessToken } : {}),
    });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): AuthState => this.state;
  getServerSnapshot = (): AuthState => SERVER_STATE;

  attach = (): void => undefined;
  detach = (): void => undefined;

  restore = (): Promise<void> => {
    this.restoring ??= (async () => {
      try {
        await this.reloadUser();
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          this.setUnauthenticated();
          return;
        }
        this.setUnauthenticated();
        if (isApiError(error) && error.status !== 0) throw error;
      }
    })();
    return this.restoring;
  };

  login = async (credentials: LoginRequest): Promise<User> => {
    const response = await api.auth.login(credentials);
    if (this.mockMode && isRecord(response) && isRecord(response.tokens)) {
      this.mockAccessToken =
        typeof response.tokens.accessToken === 'string' ? response.tokens.accessToken : null;
      configureApiClient({ getAccessToken: () => this.mockAccessToken });
    }
    return this.reloadUser();
  };

  register = async (input: RegisterRequest): Promise<void> => {
    await api.auth.register(input);
  };

  logout = async (): Promise<void> => {
    await api.auth.logout();
    this.mockAccessToken = null;
    this.setUnauthenticated();
  };

  reloadUser = async (): Promise<User> => {
    try {
      const user = sessionUser(await api.auth.session());
      this.assertAllowed(user);
      this.setState({ status: 'authenticated', user });
      return user;
    } catch (error) {
      if (isApiError(error) && error.status === 401) this.expire();
      throw error;
    }
  };

  private assertAllowed(user: User): void {
    if (this.allowedRoles && !this.allowedRoles.includes(user.role)) {
      throw new ApiClientError({
        status: 403,
        code: 'wrong_app',
        message: 'This account cannot sign in here. Use the right app for your account type.',
      });
    }
  }

  private expire(): void {
    const wasAuthenticated = this.state.status === 'authenticated';
    this.setUnauthenticated();
    if (wasAuthenticated) this.onSessionExpired?.();
  }

  private setUnauthenticated(): void {
    this.setState({ status: 'unauthenticated', user: null });
  }

  private setState(next: AuthState): void {
    if (this.state.status === next.status && this.state.user === next.user) return;
    this.state = next;
    this.listeners.forEach((listener) => listener());
  }
}
