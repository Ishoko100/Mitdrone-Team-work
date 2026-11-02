'use client';

import { useState } from 'react';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Textarea } from './input';
import { Label } from './label';

export interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  label?: string;
  /** Minimum characters. Use 0 to make the reason optional. */
  minLength?: number;
  onConfirm: (reason: string) => void | Promise<void>;
}

/** Collects a justification before a sensitive action. The reason is recorded in the audit log. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  label = 'Reason',
  minLength = 3,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  function close(next: boolean) {
    if (!next) {
      setReason('');
      setError(undefined);
    }
    onOpenChange(next);
  }

  async function submit() {
    const text = reason.trim();
    if (text.length < minLength)
      return setError(`Please enter a reason (at least ${minLength} characters).`);
    setLoading(true);
    try {
      await onConfirm(text);
      close(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reason-text">
            {label}
            {minLength === 0 ? ' (optional)' : ''}
          </Label>
          <Textarea
            id="reason-text"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(undefined);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'reason-error' : undefined}
            rows={4}
          />
          {error ? (
            <p id="reason-error" role="alert" className="text-destructive text-sm font-medium">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={submit}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
