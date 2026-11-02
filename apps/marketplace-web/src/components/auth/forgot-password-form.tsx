'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@mitdrone/sdk';
import { Button, Form } from '@mitdrone/ui';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RootError, TextField } from '@/components/forms/fields';
import { applyApiError } from '@/lib/forms';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  if (sent) {
    return (
      <div className="space-y-3 text-center" role="status">
        <MailCheck className="text-primary mx-auto size-10" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          If an account exists for that address, we have sent a link to reset your password.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we will send you a reset link.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async ({ email }) => {
            try {
              await api.auth.forgotPassword(email);
              setSent(true);
            } catch (error) {
              applyApiError(form, error);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Send reset link
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
