'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ROLE_LABELS, useAuth } from '@mitdrone/auth';
import { api, getErrorMessage, useAdminUsers, useCreateUser, useUpdateUser } from '@mitdrone/sdk';
import { ROLES, type Role, type User } from '@mitdrone/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorState,
  Form,
  Label,
  PageHeader,
  RootError,
  Select,
  SelectContent,
  SelectField,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  TextField,
  toast,
} from '@mitdrone/ui';
import { formatDate, formatRelative } from '@mitdrone/utils';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ExportMenu } from '@/components/common/export-menu';
import { FilterBar } from '@/components/common/filter-bar';
import { applyApiError } from '@/lib/forms';
import { useUrlState } from '@/lib/url';

import type { ColumnDef } from '@tanstack/react-table';

const ASSIGNABLE: Role[] = ['customer', 'support', 'admin', 'super_admin'];
const inviteSchema = z.object({
  name: z.string().min(2, 'Enter a full name'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'super_admin', 'support']),
});
const ROLE_GUIDE: [Role, string][] = [
  ['super_admin', 'Everything: roles, platform settings, approvals, refunds, payouts.'],
  ['admin', 'Approve vendors and products, process payouts, refund orders, resolve disputes.'],
  ['support', 'Read-only access, plus assigning and replying to disputes.'],
];

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateUser();
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', email: '', role: 'support' },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Add team member
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            They can sign in with the email below. Choose the narrowest role that fits.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await create.mutateAsync(v);
                toast.success(`${v.name} added as ${ROLE_LABELS[v.role]}`);
                form.reset();
                setOpen(false);
              } catch (e) {
                applyApiError(form, e);
              }
            })}
          >
            <RootError message={form.formState.errors.root?.message} />
            <TextField control={form.control} name="name" label="Full name" />
            <TextField control={form.control} name="email" label="Email" type="email" />
            <SelectField
              control={form.control}
              name="role"
              label="Role"
              options={(['support', 'admin', 'super_admin'] as const).map((r) => ({
                value: r,
                label: ROLE_LABELS[r],
              }))}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Add member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTable() {
  const { user: me, can } = useAuth();
  const url = useUrlState();
  const role = url.get('role') as Role | undefined;
  const status = url.get('status');
  const q = url.get('q');
  const filters = { ...(role ? { role } : {}), ...(status ? { status } : {}), ...(q ? { q } : {}) };
  const list = useAdminUsers({ page: url.page, pageSize: 10, ...filters });
  const update = useUpdateUser();
  const [roleTarget, setRoleTarget] = useState<User>();
  const [newRole, setNewRole] = useState<Role>('support');
  const [statusTarget, setStatusTarget] = useState<User>();
  const write = can('admin.write');
  const superAdmin = can('admin.roles.edit');
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (u) => u.name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <p className="font-medium">
              {row.original.name}
              {row.original.id === me?.id ? (
                <Badge variant="secondary" className="ml-2">
                  You
                </Badge>
              ) : null}
            </p>
            <p className="text-muted-foreground text-xs">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant={row.original.role === 'customer' ? 'outline' : 'default'}>
            {ROLE_LABELS[row.original.role]}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'last',
        header: 'Last sign-in',
        accessorFn: (u) => u.lastLoginAt ?? '',
        cell: ({ row }) =>
          row.original.lastLoginAt ? (
            <span className="whitespace-nowrap">{formatRelative(row.original.lastLoginAt)}</span>
          ) : (
            <span className="text-muted-foreground">Never</span>
          ),
      },
      {
        id: 'joined',
        accessorFn: (u) => u.createdAt,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const u = row.original;
          const self = u.id === me?.id;
          const vendorSide = u.role === 'vendor_owner' || u.role === 'vendor_staff';
          const canRole = superAdmin && !self && !vendorSide;
          const canStatus = write && !self;
          if (!canRole && !canStatus) return <span className="sr-only">No actions</span>;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canRole ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setNewRole(u.role);
                      setRoleTarget(u);
                    }}
                  >
                    Change role…
                  </DropdownMenuItem>
                ) : null}
                {canRole && canStatus ? <DropdownMenuSeparator /> : null}
                {canStatus ? (
                  <DropdownMenuItem
                    destructive={u.status !== 'suspended'}
                    onSelect={() => setStatusTarget(u)}
                  >
                    {u.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [me?.id, superAdmin, write],
  );

  if (list.isError)
    return <ErrorState description={getErrorMessage(list.error)} onRetry={() => list.refetch()} />;
  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Customers, sellers and the Mitdrone team."
        actions={
          <>
            <ExportMenu
              entity="users"
              title="Mitdrone users"
              fetchData={async () => {
                const all = await api.admin.users({ ...filters, pageSize: 100 });
                return {
                  headers: ['Name', 'Email', 'Role', 'Status', 'Joined'],
                  rows: all.data.map((u) => [
                    u.name,
                    u.email,
                    ROLE_LABELS[u.role],
                    u.status,
                    formatDate(u.createdAt),
                  ]),
                };
              }}
            />
            {superAdmin ? <InviteDialog /> : null}
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
          {ROLE_GUIDE.map(([r, text]) => (
            <div key={r} className="space-y-1 text-sm">
              <Badge>{ROLE_LABELS[r]}</Badge>
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={list.data?.data ?? []}
        isLoading={list.isPending}
        searchable={false}
        getRowId={(u) => u.id}
        emptyTitle="No users match these filters"
        serverPagination={{
          page: list.data?.meta.page ?? url.page,
          pageSize: 10,
          total: list.data?.meta.total ?? 0,
          onPageChange: (page) => url.set({ page }),
        }}
        toolbar={
          <FilterBar
            searchPlaceholder="Search name or email"
            filters={[
              {
                param: 'role',
                label: 'Role',
                options: ROLES.map((r) => [r, ROLE_LABELS[r]] as const),
              },
              {
                param: 'status',
                label: 'Status',
                options: [
                  ['active', 'Active'],
                  ['suspended', 'Suspended'],
                  ['pending', 'Pending'],
                ],
              },
            ]}
          />
        }
      />

      <Dialog open={Boolean(roleTarget)} onOpenChange={(o) => !o && setRoleTarget(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role for {roleTarget?.name}</DialogTitle>
            <DialogDescription>
              Role changes take effect on their next request and are recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-role">New role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(undefined)}>
              Cancel
            </Button>
            <Button
              disabled={!roleTarget || newRole === roleTarget.role}
              loading={update.isPending}
              onClick={() =>
                roleTarget &&
                update.mutate(
                  { id: roleTarget.id, role: newRole },
                  {
                    onSuccess: () => {
                      toast.success(`${roleTarget.name} is now ${ROLE_LABELS[newRole]}`);
                      setRoleTarget(undefined);
                    },
                    onError: fail,
                  },
                )
              }
            >
              Change role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(o) => !o && setStatusTarget(undefined)}
        destructive={statusTarget?.status !== 'suspended'}
        title={
          statusTarget?.status === 'suspended'
            ? `Reactivate ${statusTarget.name}?`
            : `Suspend ${statusTarget?.name}?`
        }
        description={
          statusTarget?.status === 'suspended'
            ? 'They will be able to sign in again.'
            : 'They are signed out and cannot sign in until reactivated.'
        }
        confirmLabel={statusTarget?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
        onConfirm={async () => {
          if (statusTarget)
            await update
              .mutateAsync({
                id: statusTarget.id,
                status: statusTarget.status === 'suspended' ? 'active' : 'suspended',
              })
              .then(() => toast.success('Account updated'))
              .catch(fail);
        }}
      />
    </>
  );
}
