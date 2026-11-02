'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  useCreateService,
  useSendQuote,
  useServiceCategories,
  useVendorServiceRequests,
  useVendorServices,
} from '@mitdrone/sdk';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Form,
  PageHeader,
  RootError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectField,
  Skeleton,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  TextareaField,
  toast,
} from '@mitdrone/ui';
import { formatDate, formatMoney, NIGERIAN_STATES } from '@mitdrone/utils';
import { Briefcase, Plus, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

import { applyApiError } from '@/lib/forms';

import { NumberField } from '../products/form-parts';

import type { ServiceRequest } from '@mitdrone/types';

const serviceSchema = z.object({
  title: z.string().min(5, 'At least 5 characters'),
  description: z.string().min(20, 'Describe the service (20+ characters)'),
  categoryId: z.string().min(1, 'Choose a category'),
  pricingModel: z.enum(['per_hectare', 'per_hour', 'per_project', 'quote']),
  startingPriceMajor: z.coerce.number().positive().optional(),
  coverageStates: z.array(z.string()).min(1, 'Choose at least one state'),
});
const quoteSchema = z.object({
  priceMajor: z.coerce.number().positive('Enter a price'),
  message: z.string().min(10, 'Add a short message'),
  estimatedDays: z.coerce.number().int().min(1, 'At least 1 day'),
});
const MODELS = [
  { value: 'per_hectare', label: 'Per hectare' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_project', label: 'Per project' },
  { value: 'quote', label: 'Quote on request' },
];

function CreateService({ vendorId }: { vendorId: string }) {
  const [open, setOpen] = useState(false);
  const categories = useServiceCategories();
  const create = useCreateService(vendorId);
  type I = z.input<typeof serviceSchema>;
  const form = useForm<I, unknown, z.output<typeof serviceSchema>>({
    resolver: zodResolver(serviceSchema) as unknown as Resolver<
      I,
      unknown,
      z.output<typeof serviceSchema>
    >,
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      pricingModel: 'per_project',
      coverageStates: [],
    },
  });
  const states = form.watch('coverageStates');
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New service</DialogTitle>
          <DialogDescription>
            Services are reviewed before they appear on Mitdrone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await create.mutateAsync(v);
                toast.success('Service submitted for review');
                form.reset();
                setOpen(false);
              } catch (e) {
                applyApiError(form, e);
              }
            })}
          >
            <RootError message={form.formState.errors.root?.message} />
            <TextField control={form.control} name="title" label="Title" />
            <SelectField
              control={form.control}
              name="categoryId"
              label="Category"
              options={(categories.data ?? [])
                .filter((c) => c.group !== 'professional')
                .map((c) => ({ value: c.id, label: c.name }))}
            />
            <TextareaField control={form.control} name="description" label="Description" rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="pricingModel"
                label="Pricing"
                options={MODELS}
              />
              <NumberField
                control={form.control}
                name="startingPriceMajor"
                label="Starting price (optional)"
                prefix="₦"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Where you work</p>
              <Select
                value=""
                onValueChange={(s) =>
                  !states.includes(s) &&
                  form.setValue('coverageStates', [...states, s], { shouldValidate: true })
                }
              >
                <SelectTrigger aria-label="Add a state">
                  <SelectValue placeholder="Add a state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {states.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {states.map((s) => (
                    <li key={s}>
                      <Badge variant="secondary" className="gap-1">
                        {s}
                        <button
                          type="button"
                          aria-label={`Remove ${s}`}
                          onClick={() =>
                            form.setValue(
                              'coverageStates',
                              states.filter((x) => x !== s),
                            )
                          }
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
              {form.formState.errors.coverageStates ? (
                <p role="alert" className="text-destructive text-sm font-medium">
                  {String(form.formState.errors.coverageStates.message)}
                </p>
              ) : null}
            </div>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Submit service
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SendQuote({ vendorId, request }: { vendorId: string; request: ServiceRequest }) {
  const [open, setOpen] = useState(false);
  const send = useSendQuote(vendorId);
  type I = z.input<typeof quoteSchema>;
  const form = useForm<I, unknown, z.output<typeof quoteSchema>>({
    resolver: zodResolver(quoteSchema) as unknown as Resolver<
      I,
      unknown,
      z.output<typeof quoteSchema>
    >,
    defaultValues: { message: '' },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Send quote</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quote for “{request.title}”</DialogTitle>
          <DialogDescription>
            {request.city ? `${request.city}, ` : ''}
            {request.state}
            {request.areaHectares ? ` · ${request.areaHectares} ha` : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await send.mutateAsync({ requestId: request.id, ...v });
                toast.success('Quote sent');
                setOpen(false);
              } catch (e) {
                applyApiError(form, e);
              }
            })}
          >
            <RootError message={form.formState.errors.root?.message} />
            <NumberField control={form.control} name="priceMajor" label="Your price" prefix="₦" />
            <NumberField
              control={form.control}
              name="estimatedDays"
              label="Estimated days to deliver"
            />
            <TextareaField
              control={form.control}
              name="message"
              label="Message to the customer"
              rows={3}
            />
            <Button type="submit" loading={form.formState.isSubmitting}>
              Send quote
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesView() {
  const { user } = useAuth();
  const v = user?.vendorId;
  const services = useVendorServices(v);
  const requests = useVendorServiceRequests(v);
  return (
    <>
      <PageHeader
        title="Services"
        description="Offer drone services and respond to customer projects."
        actions={v ? <CreateService vendorId={v} /> : undefined}
      />
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My services</TabsTrigger>
          <TabsTrigger value="requests">Open projects</TabsTrigger>
        </TabsList>
        <TabsContent value="mine">
          {services.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : services.isError ? (
            <p role="alert" className="text-destructive">
              {getErrorMessage(services.error)}
            </p>
          ) : services.data.data.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No services yet"
              description="List a service such as mapping, spraying or inspection."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {services.data.data.map((s) => (
                <li key={s.id} className="bg-card space-y-2 rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{s.title}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{s.description}</p>
                  <p className="text-sm font-medium">
                    {s.startingPrice ? `From ${formatMoney(s.startingPrice)}` : 'Quote on request'}{' '}
                    · {s.coverageStates.length} state{s.coverageStates.length === 1 ? '' : 's'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="requests">
          {requests.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : requests.isError ? (
            <p role="alert" className="text-destructive">
              {getErrorMessage(requests.error)}
            </p>
          ) : requests.data.data.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No matching projects"
              description="Projects matching your service categories appear here."
            />
          ) : (
            <ul className="space-y-3">
              {requests.data.data.map((r) => (
                <li
                  key={r.id}
                  className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {r.city ? `${r.city}, ` : ''}
                      {r.state} · {formatDate(r.createdAt)}
                      {r.budget ? ` · Budget ${formatMoney(r.budget)}` : ''}
                    </p>
                    <p className="line-clamp-1 text-sm">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {v ? <SendQuote vendorId={v} request={r} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
