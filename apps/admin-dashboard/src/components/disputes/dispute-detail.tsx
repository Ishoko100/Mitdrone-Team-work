'use client';

import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  useAdminDispute,
  useAssignDispute,
  useMessageDispute,
  useResolveDispute,
} from '@mitdrone/sdk';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Label,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  Skeleton,
  StatusBadge,
  Textarea,
  toast,
} from '@mitdrone/ui';
import { formatDateTime, formatMoney } from '@mitdrone/utils';
import { Gavel, Send, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function DisputeDetail({ id }: { id: string }) {
  const { user, can } = useAuth();
  const q = useAdminDispute(id);
  const assign = useAssignDispute();
  const message = useMessageDispute();
  const resolve = useResolveDispute();
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<'refund' | 'no_refund'>('refund');
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState<string>();

  if (q.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (q.isError)
    return (
      <ErrorState
        title="We could not load this dispute"
        description={getErrorMessage(q.error)}
        onRetry={() => q.refetch()}
      />
    );
  const d = q.data;
  const closed = d.status.startsWith('resolved') || d.status === 'closed';
  const mine = d.assignedTo === user?.id;
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  return (
    <>
      <PageHeader
        title={`Dispute ${d.id}`}
        description={`Opened ${formatDateTime(d.createdAt)} · ${formatMoney(d.amount)}`}
        actions={
          <>
            <StatusBadge status={d.status} />
            {!closed && !mine && can('admin.disputes.handle') ? (
              <Button
                variant="outline"
                loading={assign.isPending}
                onClick={() =>
                  assign.mutate(d.id, {
                    onSuccess: () => toast.success('Assigned to you'),
                    onError: fail,
                  })
                }
              >
                <UserCheck /> Assign to me
              </Button>
            ) : null}
            {!closed && can('admin.write') ? (
              <Button onClick={() => setOpen(true)}>
                <Gavel /> Resolve
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3" aria-label="Messages">
              {d.messages.map((m) => (
                <li
                  key={m.id}
                  className={`max-w-[85%] rounded-xl border p-3 text-sm ${m.authorRole === 'customer' ? 'bg-muted/50' : m.authorRole.startsWith('vendor') ? 'bg-card' : 'bg-accent/50 ml-auto'}`}
                >
                  <p className="text-muted-foreground mb-1 text-xs font-medium capitalize">
                    {m.authorRole.replace(/_/g, ' ')} · {formatDateTime(m.createdAt)}
                  </p>
                  <p>{m.body}</p>
                </li>
              ))}
            </ul>
            {closed ? (
              <p role="status" className="bg-muted rounded-lg border p-3 text-sm">
                This dispute is closed. {d.resolution}
              </p>
            ) : (
              <form
                className="space-y-2 border-t pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = reply.trim();
                  if (!body) return;
                  message.mutate(
                    { id: d.id, body },
                    {
                      onSuccess: () => {
                        setReply('');
                        toast.success('Message sent');
                      },
                      onError: fail,
                    },
                  );
                }}
              >
                <Label htmlFor="reply">Reply to the customer and seller</Label>
                <Textarea
                  id="reply"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                />
                <Button type="submit" disabled={!reply.trim()} loading={message.isPending}>
                  <Send /> Send message
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Reason:</span>{' '}
                <span className="font-medium capitalize">{d.reason.replace(/_/g, ' ')}</span>
              </p>
              <p>{d.description}</p>
              <p>
                <span className="text-muted-foreground">Assigned:</span>{' '}
                {d.assignedTo ? (mine ? 'You' : d.assignedTo) : 'Unassigned'}
              </p>
              <Button asChild variant="link" className="h-auto p-0">
                <Link href={`/orders/${d.orderId}`}>View order</Link>
              </Button>
            </CardContent>
          </Card>
          {!can('admin.write') ? (
            <p role="note" className="bg-muted rounded-lg border p-3 text-sm">
              Support agents can assign disputes and reply. Only admins can resolve them or issue
              refunds.
            </p>
          ) : null}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setError(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve dispute</DialogTitle>
            <DialogDescription>
              Choose the outcome. A refund returns the order total to the customer. This is recorded
              in the audit log.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={outcome}
            onValueChange={(v) => setOutcome(v as 'refund' | 'no_refund')}
            aria-label="Outcome"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
              <RadioGroupItem value="refund" /> Refund the customer ({formatMoney(d.amount)})
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
              <RadioGroupItem value="no_refund" /> No refund (item matched the listing)
            </label>
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="resolution">Resolution note</Label>
            <Textarea
              id="resolution"
              rows={3}
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                setError(undefined);
              }}
            />
            {error ? (
              <p role="alert" className="text-destructive text-sm font-medium">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={outcome === 'refund' ? 'destructive' : 'default'}
              loading={resolve.isPending}
              onClick={() => {
                if (resolution.trim().length < 3) return setError('Add a short resolution note.');
                resolve.mutate(
                  { id: d.id, outcome, resolution: resolution.trim() },
                  {
                    onSuccess: () => {
                      toast.success('Dispute resolved');
                      setOpen(false);
                    },
                    onError: fail,
                  },
                );
              }}
            >
              {outcome === 'refund' ? 'Refund and resolve' : 'Resolve without refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
