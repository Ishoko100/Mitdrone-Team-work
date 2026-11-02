'use client';

import { ADMIN_ROLES, VENDOR_ROLES, type Role } from '@mitdrone/types';
import { useRouter } from 'next/navigation';
import { useEffect, type ComponentType, type ReactNode } from 'react';

import { safeNextPath } from './roles';
import { useAuth } from './use-auth';

/**
 * CLIENT-SIDE guards for UX only. They keep screens from rendering for the wrong user, but the
 * API is what actually protects data. PRODUCTION: also gate routes in Next middleware using the
 * httpOnly session cookie so protected HTML is never served to anonymous users.
 */
export function Forbidden({
  message = 'You do not have access to this page.',
}: {
  message?: string;
}) {
  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-2 px-6 text-center"
      role="alert"
    >
      <p className="text-muted-foreground text-sm font-medium">403</p>
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="text-muted-foreground text-sm">{message}</p>
    </main>
  );
}

export interface RequireAuthProps {
  /** Allowed roles. Omit to allow any signed-in user. */
  roles?: readonly Role[];
  loginPath?: string;
  /** Shown while the session is being restored. */
  fallback?: ReactNode;
  /** Shown to signed-in users with the wrong role. */
  forbidden?: ReactNode;
  children: ReactNode;
}

export function RequireAuth({
  roles,
  loginPath = '/login',
  fallback = null,
  forbidden,
  children,
}: RequireAuthProps) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`${loginPath}?next=${encodeURIComponent(next)}`);
    }
  }, [status, loginPath, router]);

  if (status !== 'authenticated' || !user) return <>{fallback}</>;
  if (roles && !roles.includes(user.role)) return <>{forbidden ?? <Forbidden />}</>;
  return <>{children}</>;
}

/** For /login and /register: sends signed-in users onward (honouring a safe ?next=). */
export function GuestOnly({
  redirectTo = '/',
  fallback = null,
  children,
}: {
  redirectTo?: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(
        safeNextPath(new URLSearchParams(window.location.search).get('next'), redirectTo),
      );
    }
  }, [status, redirectTo, router]);
  if (status === 'loading' || status === 'authenticated') return <>{fallback}</>;
  return <>{children}</>;
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: Omit<RequireAuthProps, 'children'> = {},
) {
  function Guarded(props: P) {
    return (
      <RequireAuth {...options}>
        <Component {...props} />
      </RequireAuth>
    );
  }
  Guarded.displayName = `withAuth(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Guarded;
}

/** vendor_owner and vendor_staff only. */
export const withVendorAuth = <P extends object>(
  Component: ComponentType<P>,
  options: Omit<RequireAuthProps, 'children' | 'roles'> = {},
) => withAuth(Component, { ...options, roles: VENDOR_ROLES });

/** admin, super_admin and support only. */
export const withAdminAuth = <P extends object>(
  Component: ComponentType<P>,
  options: Omit<RequireAuthProps, 'children' | 'roles'> = {},
) => withAuth(Component, { ...options, roles: ADMIN_ROLES });
