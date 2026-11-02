'use client';

import { getErrorMessage, useAddAddress, useAddresses, useDeleteAddress } from '@mitdrone/sdk';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Skeleton,
  toast,
} from '@mitdrone/ui';
import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

import { AddressForm } from '@/components/checkout/address-form';

export function AddressesView() {
  const addresses = useAddresses();
  const add = useAddAddress();
  const del = useDeleteAddress();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string>();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Addresses</h1>
          <p className="text-muted-foreground text-sm">
            Saved delivery addresses for faster checkout.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>New address</DialogTitle>
              <DialogDescription>
                We will use it as your default if it is your first.
              </DialogDescription>
            </DialogHeader>
            <AddressForm
              submitLabel="Save address"
              onSubmit={async (address) => {
                try {
                  await add.mutateAsync(address);
                  toast.success('Address saved');
                  setOpen(false);
                } catch (e) {
                  toast.error(getErrorMessage(e));
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </header>
      {addresses.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : addresses.isError ? (
        <ErrorState onRetry={() => addresses.refetch()} />
      ) : addresses.data.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add one to speed up checkout."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.data.map((a) => (
            <li key={a.id} className="bg-card space-y-2 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.fullName}</p>
                {a.isDefault ? <Badge>Default</Badge> : null}
              </div>
              <address className="text-muted-foreground text-sm not-italic">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state}
                <br />
                {a.phone}
              </address>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setToDelete(a.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Delete this address?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDelete) {
            try {
              await del.mutateAsync(toDelete);
              toast.success('Address deleted');
            } catch (e) {
              toast.error(getErrorMessage(e));
            }
          }
        }}
      />
    </div>
  );
}
