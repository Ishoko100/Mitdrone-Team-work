import { api, ApiClientError, configureApiClient, isApiError } from '@mitdrone/sdk';

import { createTokenStore, type TokenStore } from './token-store';

import type { AuthResponse, LoginRequest, RegisterRequest, Role, User } from '@mitdrone/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export interface AuthState {
  status: AuthStatus;
  user: User | null;
}

export interface AuthControllerOptions {
  /** Namespaces storage so the three apps never share a session. */
  storageKey?: string;
  /** Roles allowed to sign in to this app. A customer cannot sign in to the vendor dashboard. */
  allowedRoles?: readonly Role[];
  /** Called when a session ends unexpectedly (refresh failed). */
  onSessionExpired?: () => void;
}

const SERVER_STATE: AuthState = { status: 'loading', user: null };
const REFRESH_MARGIN_SECONDS = 60;

/**
 * Framework-free session manager: token storage, single-flight refresh, proactive refresh before
 * expiry, cross-tab logout, and role restrictions. React subscribes through useSyncExternalStore.
 */
export class AuthController {
  private state: AuthState = { status: 'loading', user: null };
  private listeners = new Set<() => void>();
  private readonly store: TokenStore;
  private readonly allowedRoles: readonly Role[] | undefined;
  private readonly onSessionExpired: (() => void) | undefined;
  private restoring: Promise<void> | null = null;
  private refreshing: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private expiresAt = 0;
  private detachStorage: (() => void) | undefined;

  constructor(options: AuthControllerOptions = {}) {
    this.store = createTokenStore(options.storageKey ?? 'mitdrone.auth');
    this.allowedRoles = options.allowedRoles;
    this.onSessionExpired = options.onSessionExpired;
  }

  /** Bind the shared SDK client to this live controller after React selects its instance. */
  bindApiClient(): void {
    configureApiClient({
      getAccessToken: () => this.store.getAccess(),
      refreshAccessToken: async () => ((await this.refresh()) ? this.store.getAccess() : null),
      onAuthFailure: () => this.expire(),
    });
  }

  /* ---------------------------------------------------- external store API */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): AuthState => this.state;
  getServerSnapshot = (): AuthState => SERVER_STATE;

  /* ----------------------------------------------------------- lifecycle */
  /** Start listening for cross-tab changes and resume the refresh timer. Pair with detach(). */
  attach = (): void => {
    this.detachStorage?.();
    this.detachStorage = this.store.subscribe(() => {
      if (!this.store.getRefresh()) {
        if (this.state.status === 'authenticated') this.endSession();
      } else if (this.state.status !== 'authenticated') {
        void this.refresh();
      }
    });
    if (this.state.status === 'authenticated') this.scheduleRefresh();
  };

  detach = (): void => {
    this.detachStorage?.();
    this.detachStorage = undefined;
    clearTimeout(this.timer);
  };

  /** Resume a session from the stored refresh token. Safe to call more than once. */
  restore = (): Promise<void> => {
    this.restoring ??= (async () => {
      if (!this.store.getRefresh()) return this.setUnauthenticated();
      const ok = await this.refresh();
      if (!ok && this.state.status === 'loading') this.setUnauthenticated();
    })();
    return this.restoring;
  };

  /* -------------------------------------------------------------- actions */
  login = async (credentials: LoginRequest): Promise<User> =>
    this.startSession(await api.auth.login(credentials));

  register = async (input: RegisterRequest): Promise<User> =>
    this.startSession(await api.auth.register(input));

  logout = async (): Promise<void> => {
    try {
      if (this.store.getAccess()) await api.auth.logout();
    } catch {
      // Logging out must always succeed locally.
    }
    this.endSession();
  };

  reloadUser = async (): Promise<void> => {
    const user = await api.auth.me();
    this.setState({ status: 'authenticated', user });
  };

  /** Single-flight refresh. Returns false when there is no valid session. */
  refresh = (): Promise<boolean> => {
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  };

  /* ------------------------------------------------------------- internals */
  private assertAllowed(user: User): void {
    if (this.allowedRoles && !this.allowedRoles.includes(user.role)) {
      throw new ApiClientError({
        status: 403,
        code: 'wrong_app',
        message: 'This account cannot sign in here. Use the right app for your account type.',
      });
    }
  }

  private startSession(response: AuthResponse): User {
    this.assertAllowed(response.user);
    this.store.set(response.tokens);
    this.expiresAt = Date.now() + response.tokens.expiresIn * 1000;
    this.setState({ status: 'authenticated', user: response.user });
    this.scheduleRefresh();
    return response.user;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = this.store.getRefresh();
    if (!refreshToken) return false;
    try {
      this.startSession(await api.auth.refresh(refreshToken));
      return true;
    } catch (error) {
      // Offline: keep the stored session and try again later.
      if (isApiError(error) && error.status === 0) return false;
      this.expire();
      return false;
    }
  }

  private scheduleRefresh(): void {
    clearTimeout(this.timer);
    const wait = Math.max(this.expiresAt - Date.now() - REFRESH_MARGIN_SECONDS * 1000, 10_000);
    this.timer = setTimeout(() => void this.refresh(), wait);
  }

  /** Session ended by the server (refresh rejected or 401 unrecoverable). */
  private expire(): void {
    const wasAuthenticated = this.state.status === 'authenticated';
    this.endSession();
    if (wasAuthenticated) this.onSessionExpired?.();
  }

  private endSession(): void {
    clearTimeout(this.timer);
    this.store.clear();
    this.setUnauthenticated();
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
