'use client';

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { AuthController, type AuthControllerOptions } from './controller';
import { AuthContext, buildAuthValue } from './use-auth';

export interface AuthProviderProps extends AuthControllerOptions {
  children: ReactNode;
  /** Inject a controller (tests). */
  controller?: AuthController;
}

export function AuthProvider({ children, controller, ...options }: AuthProviderProps) {
  const [ctrl] = useState(() => controller ?? new AuthController(options));
  const state = useSyncExternalStore(ctrl.subscribe, ctrl.getSnapshot, ctrl.getServerSnapshot);

  useEffect(() => {
    ctrl.attach();
    void ctrl.restore();
    return ctrl.detach;
  }, [ctrl]);

  const value = useMemo(
    () =>
      buildAuthValue(state, {
        login: ctrl.login,
        register: ctrl.register,
        logout: ctrl.logout,
        reloadUser: ctrl.reloadUser,
      }),
    [state, ctrl],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
