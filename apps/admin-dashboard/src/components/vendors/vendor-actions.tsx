'use client';

import {
  getErrorMessage,
  useApproveVendor,
  useRejectVendor,
  useSuspendVendor,
} from '@mitdrone/sdk';
import { ConfirmDialog, ReasonDialog, toast } from '@mitdrone/ui';
import { useState } from 'react';

import type { Vendor } from '@mitdrone/types';

export type VendorAction = 'approve' | 'reject' | 'suspend';
/** Which actions make sense for a vendor in each state. Mirrors the API rules. */
export const availableActions = (v: Pick<Vendor, 'status'>): VendorAction[] =>
  v.status === 'approved'
    ? ['suspend']
    : v.status === 'suspended'
      ? ['approve']
      : v.status === 'rejected'
        ? ['approve']
        : v.status === 'pending_review'
          ? ['approve', 'reject']
          : [];

/** One place for the approve / reject / suspend dialogs, used by the list, bulk actions and detail page. */
export function useVendorActions() {
  const approve = useApproveVendor();
  const reject = useRejectVendor();
  const suspend = useSuspendVendor();
  const [target, setTarget] = useState<{
    action: VendorAction;
    vendor: Pick<Vendor, 'id' | 'name'>;
  }>();
  const close = () => setTarget(undefined);
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  const dialogs = (
    <>
      <ConfirmDialog
        open={target?.action === 'approve'}
        onOpenChange={(o) => !o && close()}
        title={`Approve ${target?.vendor.name}?`}
        description="The seller will be verified and can start listing products immediately. This is recorded in the audit log."
        confirmLabel="Approve vendor"
        onConfirm={async () => {
          if (target)
            await approve
              .mutateAsync(target.vendor.id)
              .then(() => toast.success(`${target.vendor.name} approved`))
              .catch(fail);
        }}
      />
      <ReasonDialog
        open={target?.action === 'reject'}
        onOpenChange={(o) => !o && close()}
        title={`Reject ${target?.vendor.name}?`}
        description="The seller sees this reason and can fix the issues and resubmit."
        confirmLabel="Reject vendor"
        destructive
        onConfirm={async (reason) => {
          if (target)
            await reject
              .mutateAsync({ id: target.vendor.id, reason })
              .then(() => toast.success(`${target.vendor.name} rejected`))
              .catch(fail);
        }}
      />
      <ReasonDialog
        open={target?.action === 'suspend'}
        onOpenChange={(o) => !o && close()}
        title={`Suspend ${target?.vendor.name}?`}
        description="Their listings are hidden and payouts are held. Record why for the audit log."
        confirmLabel="Suspend vendor"
        destructive
        onConfirm={async (reason) => {
          if (target)
            await suspend
              .mutateAsync({ id: target.vendor.id, reason })
              .then(() => toast.success(`${target.vendor.name} suspended`))
              .catch(fail);
        }}
      />
    </>
  );
  return {
    request: (action: VendorAction, vendor: Pick<Vendor, 'id' | 'name'>) =>
      setTarget({ action, vendor }),
    dialogs,
    approveMutation: approve,
  };
}

export const ACTION_LABELS: Record<VendorAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  suspend: 'Suspend',
};
