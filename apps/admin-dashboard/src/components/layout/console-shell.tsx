'use client';

import { ROLE_LABELS, RequireAuth, useAuth } from '@mitdrone/auth';
import { api, useAdminVendors } from '@mitdrone/sdk';
import { ADMIN_ROLES } from '@mitdrone/types';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  ThemeToggle,
  cn,
  toast,
} from '@mitdrone/ui';
import { initials } from '@mitdrone/utils';
import {
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, type ReactNode } from 'react';

import { useSidebarStore } from '@/stores/sidebar';

import { Brand } from './brand';

export const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/disputes', label: 'Disputes', icon: Gavel },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/users', label: 'Users & roles', icon: Users },
  { href: '/audit-logs', label: 'Audit logs', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const pending = useAdminVendors({ status: 'pending_review', pageSize: 1 }).data?.meta.total ?? 0;
  return (
    <nav aria-label="Main">
      <ul className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className={cn('flex-1', collapsed && 'sr-only')}>{label}</span>
                {href === '/vendors' && pending > 0 ? (
                  <Badge variant="warning" className={cn(collapsed && 'sr-only')}>
                    {pending}
                    <span className="sr-only"> awaiting approval</span>
                  </Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Chrome({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarStore();
  const [backendHealth, setBackendHealth] = useState<{ status?: string; service?: string } | undefined>(undefined);

  useEffect(() => {
    let active = true;
    api.backend.health.live().then((h) => {
      if (active) setBackendHealth(h);
    }).catch(() => {
      if (active) setBackendHealth(undefined);
    });
    return () => { active = false; };
  }, []);
  return (
    <div className="bg-muted/30 min-h-screen">
      <aside
        className={cn(
          'bg-background fixed inset-y-0 left-0 z-30 hidden flex-col border-r p-3 transition-[width] lg:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className={cn('flex h-12 items-center', collapsed ? 'justify-center' : 'px-2')}>
          <Brand compact={collapsed} />
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <SidebarNav collapsed={collapsed} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground justify-start"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen />
          ) : (
            <>
              <PanelLeftClose /> Collapse
            </>
          )}
        </Button>
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Admin</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn('transition-[padding]', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          {user ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" aria-hidden="true" />
              {ROLE_LABELS[user.role]}
            </Badge>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {backendHealth ? (
              <Badge
                variant={backendHealth.status === 'ok' ? 'default' : 'destructive'}
              >
                {backendHealth.service} backend · {backendHealth.status}
              </Badge>
            ) : null}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <span className="block truncate">{user.name}</span>
                    <span className="text-muted-foreground block truncate text-xs font-normal">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      try {
                        await logout();
                        toast.success('Signed out');
                        router.push('/login');
                      } catch {
                        toast.error('Could not sign out. Please try again.');
                      }
                    }}
                  >
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-7xl space-y-6 p-4 outline-none sm:p-6"
        >
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth
      roles={ADMIN_ROLES}
      fallback={
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <Chrome>{children}</Chrome>
    </RequireAuth>
  );
}
