'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSubmitBusinessQuote } from '@mitdrone/sdk';
import { quoteRequestSchema, type QuoteRequestInput } from '@mitdrone/types';
import { Button, Form } from '@mitdrone/ui';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { RootError, TextField, TextareaField } from '@/components/forms/fields';
import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof quoteRequestSchema>;

export function BusinessForm({
  topic,
  title = 'Tell us what you need',
}: {
  topic: string;
  title?: string;
}) {
  const submit = useSubmitBusinessQuote();
  const form = useForm<Input, unknown, QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: { name: '', email: '', phone: '', company: '', message: '' },
  });

  if (submit.isSuccess) {
    return (
      <div role="status" className="bg-success/5 flex items-start gap-3 rounded-xl border p-5">
        <CheckCircle2 className="text-success mt-0.5 size-5" aria-hidden="true" />
        <div>
          <p className="font-medium">Thanks, we have your request</p>
          <p className="text-muted-foreground text-sm">
            A Mitdrone specialist will reply by email within one business day.
          </p>
        </div>
      </div>
    );
  }
  return (
    <Form {...form}>
      <form
        className="bg-card space-y-4 rounded-xl border p-5"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          submit.mutateAsync({ ...values, topic }).catch((e) => applyApiError(form, e)),
        )}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <RootError message={form.formState.errors.root?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Your name" autoComplete="name" />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
          />
          <TextField
            control={form.control}
            name="company"
            label="Company (optional)"
            autoComplete="organization"
          />
        </div>
        <TextareaField control={form.control} name="message" label="How can we help?" />
        <Button type="submit" loading={submit.isPending}>
          Send request
        </Button>
      </form>
    </Form>
  );
}
