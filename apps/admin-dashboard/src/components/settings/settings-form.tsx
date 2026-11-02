'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { getErrorMessage, useAdminSettings, useUpdateSettings } from '@mitdrone/sdk';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  PageHeader,
  RootError,
  SelectField,
  Skeleton,
  Switch,
  TextField,
  toast,
} from '@mitdrone/ui';
import { formatDateTime } from '@mitdrone/utils';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

import { applyApiError } from '@/lib/forms';

import type { CurrencyCode, PlatformSettings } from '@mitdrone/types';

const CURRENCIES: CurrencyCode[] = ['NGN', 'USD', 'GBP', 'EUR'];
const money = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`);
const schema = z
  .object({
    defaultCommissionRate: z.coerce.number().min(0, 'Minimum 0%').max(50, 'Maximum 50%'),
    taxRate: z.coerce.number().min(0, 'Minimum 0%').max(30, 'Maximum 30%'),
    referralRewardRate: z.coerce.number().min(0, 'Minimum 0%').max(20, 'Maximum 20%'),
    shippingFlatRate: money('Shipping rate'),
    minimumPayout: money('Minimum payout'),
    payoutSchedule: z.enum(['weekly', 'biweekly', 'monthly']),
    defaultCurrency: z.enum(['NGN', 'USD', 'GBP', 'EUR']),
    currencies: z
      .array(z.enum(['NGN', 'USD', 'GBP', 'EUR']))
      .min(1, 'Enable at least one currency'),
    maintenanceMode: z.boolean(),
    supportEmail: z.string().email('Enter a valid email'),
  })
  .refine((v) => v.currencies.includes(v.defaultCurrency), {
    path: ['defaultCurrency'],
    message: 'The default currency must be enabled',
  });
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

const toForm = (s: PlatformSettings): Input => ({
  defaultCommissionRate: +(s.defaultCommissionRate * 100).toFixed(2),
  taxRate: +(s.taxRate * 100).toFixed(2),
  referralRewardRate: +(s.referralRewardRate * 100).toFixed(2),
  shippingFlatRate: s.shippingFlatRate.amount / 100,
  minimumPayout: s.minimumPayout.amount / 100,
  payoutSchedule: s.payoutSchedule,
  defaultCurrency: s.defaultCurrency,
  currencies: s.currencies,
  maintenanceMode: s.maintenanceMode,
  supportEmail: s.supportEmail,
});

function Editor({ settings, canEdit }: { settings: PlatformSettings; canEdit: boolean }) {
  const update = useUpdateSettings();
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Input, unknown, Values>,
    defaultValues: toForm(settings),
  });
  return (
    <Form {...form}>
      <form
        className="space-y-6"
        noValidate
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await update.mutateAsync({
              defaultCommissionRate: v.defaultCommissionRate / 100,
              taxRate: v.taxRate / 100,
              referralRewardRate: v.referralRewardRate / 100,
              shippingFlatRate: { amount: Math.round(v.shippingFlatRate * 100), currency: 'NGN' },
              minimumPayout: { amount: Math.round(v.minimumPayout * 100), currency: 'NGN' },
              payoutSchedule: v.payoutSchedule,
              defaultCurrency: v.defaultCurrency,
              currencies: v.currencies,
              maintenanceMode: v.maintenanceMode,
              supportEmail: v.supportEmail,
            });
            toast.success('Platform settings saved');
          } catch (e) {
            applyApiError(form, e);
          }
        })}
      >
        <RootError message={form.formState.errors.root?.message} />
        {!canEdit ? (
          <p role="status" className="bg-muted rounded-lg border p-3 text-sm">
            Only a super admin can change platform settings. You have read-only access.
          </p>
        ) : null}
        <fieldset disabled={!canEdit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fees and commission</CardTitle>
              <CardDescription>
                New vendors start with the default commission. Existing vendor rates are unchanged.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="defaultCommissionRate"
                label="Default commission (%)"
                inputMode="decimal"
              />
              <TextField
                control={form.control}
                name="taxRate"
                label="VAT (%)"
                inputMode="decimal"
              />
              <TextField
                control={form.control}
                name="shippingFlatRate"
                label="Flat shipping per seller (₦)"
                inputMode="decimal"
              />
              <TextField
                control={form.control}
                name="referralRewardRate"
                label="Referral reward (%)"
                inputMode="decimal"
                description="Share of a referred customer’s first order."
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SelectField
                control={form.control}
                name="payoutSchedule"
                label="Payout schedule"
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'biweekly', label: 'Every two weeks' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
              <TextField
                control={form.control}
                name="minimumPayout"
                label="Minimum payout (₦)"
                inputMode="decimal"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Currencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currencies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enabled currencies</FormLabel>
                    <div className="flex flex-wrap gap-4">
                      {CURRENCIES.map((c) => {
                        const on = (field.value ?? []).includes(c);
                        return (
                          <div key={c} className="flex items-center gap-2">
                            <Checkbox
                              id={`cur-${c}`}
                              checked={on}
                              onCheckedChange={(v) =>
                                field.onChange(
                                  v === true
                                    ? [...(field.value ?? []), c]
                                    : (field.value ?? []).filter((x) => x !== c),
                                )
                              }
                            />
                            <Label htmlFor={`cur-${c}`} className="font-normal">
                              {c}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SelectField
                control={form.control}
                name="defaultCurrency"
                label="Default currency"
                options={CURRENCIES}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                control={form.control}
                name="supportEmail"
                label="Support email"
                type="email"
              />
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Maintenance mode</FormLabel>
                      <p className="text-muted-foreground text-sm">
                        Shows a maintenance notice to shoppers and pauses checkout.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </fieldset>
        <div className="flex items-center gap-4">
          {canEdit ? (
            <Button type="submit" loading={form.formState.isSubmitting}>
              Save settings
            </Button>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Last updated {formatDateTime(settings.updatedAt)}
          </p>
        </div>
      </form>
    </Form>
  );
}

export function SettingsView() {
  const { can } = useAuth();
  const q = useAdminSettings();
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Commissions, fees, payouts and currencies. Every change is audited."
      />
      {q.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : q.isError ? (
        <ErrorState description={getErrorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <Editor key={q.data.updatedAt} settings={q.data} canEdit={can('admin.settings.edit')} />
      )}
    </>
  );
}
