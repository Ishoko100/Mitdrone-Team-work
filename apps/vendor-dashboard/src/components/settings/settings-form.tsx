'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { getErrorMessage, useUpdateVendorSettings, useVendorSettings } from '@mitdrone/sdk';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  Form,
  PageHeader,
  RootError,
  SelectField,
  Skeleton,
  StatusBadge,
  TextField,
  TextareaField,
  toast,
} from '@mitdrone/ui';
import { NIGERIAN_STATES } from '@mitdrone/utils';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

import { applyApiError } from '@/lib/forms';

import type { Vendor } from '@mitdrone/types';

const schema = z.object({
  name: z.string().min(2, 'Enter your store name'),
  description: z.string().min(20, 'Tell buyers a bit more (20+ characters)'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  website: z.string().url('Enter a full URL, e.g. https://example.com').or(z.literal('')),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Choose a state'),
  handlingDays: z.coerce.number().int().min(0, 'Must be 0 or more').max(30, 'Maximum is 30 days'),
  returnPolicy: z.string().min(10, 'Describe your return policy'),
});
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

function Editor({ vendor, canEdit }: { vendor: Vendor; canEdit: boolean }) {
  const update = useUpdateVendorSettings(vendor.id);
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Input, unknown, Values>,
    defaultValues: {
      name: vendor.name,
      description: vendor.description,
      phone: vendor.phone ?? '',
      website: vendor.website ?? '',
      city: vendor.city,
      state: vendor.state,
      handlingDays: vendor.shipping.handlingDays,
      returnPolicy: vendor.returnPolicy,
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-6"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await update.mutateAsync(values);
            toast.success('Settings saved');
          } catch (e) {
            applyApiError(form, e);
          }
        })}
      >
        <RootError message={form.formState.errors.root?.message} />
        {!canEdit ? (
          <p role="status" className="bg-muted rounded-lg border p-3 text-sm">
            You have view-only access. Ask the store owner to change settings.
          </p>
        ) : null}
        <fieldset disabled={!canEdit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store profile</CardTitle>
              <CardDescription>Shown on your public store page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField control={form.control} name="name" label="Store name" />
              <TextareaField control={form.control} name="description" label="About your store" />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="phone" label="Phone" type="tel" />
                <TextField
                  control={form.control}
                  name="website"
                  label="Website (optional)"
                  type="url"
                />
                <TextField control={form.control} name="city" label="City" />
                <SelectField
                  control={form.control}
                  name="state"
                  label="State"
                  options={NIGERIAN_STATES}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shipping and returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                control={form.control}
                name="handlingDays"
                label="Handling time (business days)"
                inputMode="numeric"
                description="How long you need to pack and ship an order."
              />
              <TextareaField
                control={form.control}
                name="returnPolicy"
                label="Return policy"
                rows={3}
              />
            </CardContent>
          </Card>
        </fieldset>
        {canEdit ? (
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save settings
          </Button>
        ) : null}
      </form>
    </Form>
  );
}

export function SettingsView() {
  const { user, can } = useAuth();
  const vendor = useVendorSettings(user?.vendorId);
  return (
    <>
      <PageHeader
        title="Settings"
        description="Store profile, shipping and policies."
        actions={vendor.data ? <StatusBadge status={vendor.data.status} /> : undefined}
      />
      {vendor.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : vendor.isError ? (
        <ErrorState description={getErrorMessage(vendor.error)} onRetry={() => vendor.refetch()} />
      ) : (
        <Editor vendor={vendor.data} canEdit={can('vendor.settings.edit')} />
      )}
    </>
  );
}
