'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, type AddressInput } from '@mitdrone/types';
import { Button, Checkbox, Form, Label } from '@mitdrone/ui';
import { NIGERIAN_STATES } from '@mitdrone/utils';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { SelectField, TextField } from '@/components/forms/fields';

import type { z } from 'zod';

type Input = z.input<typeof addressSchema>;

export function AddressForm({
  defaultName = '',
  submitLabel,
  onSubmit,
  allowSave = false,
}: {
  defaultName?: string;
  submitLabel: string;
  onSubmit: (address: AddressInput, save: boolean) => void | Promise<void>;
  allowSave?: boolean;
}) {
  const [save, setSave] = useState(true);
  const form = useForm<Input, unknown, AddressInput>({
    resolver: zodResolver(addressSchema) as unknown as Resolver<Input, unknown, AddressInput>,
    defaultValues: {
      fullName: defaultName,
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'NG',
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((values) => onSubmit(values, save))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="fullName" label="Full name" autoComplete="name" />
          <TextField
            control={form.control}
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <TextField
          control={form.control}
          name="line1"
          label="Address"
          autoComplete="address-line1"
        />
        <TextField
          control={form.control}
          name="line2"
          label="Apartment, suite, landmark (optional)"
          autoComplete="address-line2"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            control={form.control}
            name="city"
            label="City"
            autoComplete="address-level2"
          />
          <SelectField
            control={form.control}
            name="state"
            label="State"
            options={NIGERIAN_STATES}
            placeholder="Choose"
          />
          <TextField
            control={form.control}
            name="postalCode"
            label="Postal code (optional)"
            autoComplete="postal-code"
          />
        </div>
        {allowSave ? (
          <div className="flex items-center gap-2">
            <Checkbox id="save-addr" checked={save} onCheckedChange={(v) => setSave(v === true)} />
            <Label htmlFor="save-addr" className="font-normal">
              Save this address for next time
            </Label>
          </div>
        ) : null}
        <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
