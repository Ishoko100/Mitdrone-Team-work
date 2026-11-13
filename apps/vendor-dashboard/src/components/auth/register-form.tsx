'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { api, getErrorMessage } from '@mitdrone/sdk';
import { registerSchema, type RegisterRequest, type RegistrationTerms } from '@mitdrone/types';
import { Button, Form, RootError, TextField, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof registerSchema>;

export function RegisterForm() {
  const [terms, setTerms] = useState<RegistrationTerms>();
  const [termsError, setTermsError] = useState<string>();
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const form = useForm<Input, unknown, RegisterRequest>({
    resolver: zodResolver(registerSchema) as unknown as Resolver<Input, unknown, RegisterRequest>,
    defaultValues: {
      email: '',
      acceptedTerms: false,
      termsVersion: '',
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    let active = true;
    void api.auth
      .registrationTerms()
      .then((result) => {
        if (!active) return;
        setTerms(result);
        form.setValue('termsVersion', result.vendor);
      })
      .catch((error: unknown) => {
        if (active) setTermsError(getErrorMessage(error, 'Could not load the current terms.'));
      });
    return () => {
      active = false;
    };
  }, [form]);

  if (waitingForVerification) {
    return (
      <div className="space-y-4" role="status">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground text-sm">
          Check {form.getValues('email')} for the verification email. Email verification is separate
          from vendor application approval.
        </p>
        <Button
          type="button"
          variant="outline"
          loading={resending}
          onClick={async () => {
            setResending(true);
            try {
              await api.auth.resendVerification({ email: form.getValues('email') });
              toast.success('If the account can be verified, a new email will be sent.');
            } catch (error) {
              toast.error(getErrorMessage(error));
            } finally {
              setResending(false);
            }
          }}
        >
          Resend verification email
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Start selling on Mitdrone</h1>
        <p className="text-muted-foreground text-sm">
          Create your account and verify your email. A separate vendor application is required
          before you can sell.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await api.auth.register(values);
              setWaitingForVerification(true);
            } catch (e) {
              applyApiError(form, e);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField
            control={form.control}
            name="fullName"
            label="Your full name"
            autoComplete="name"
          />
          <TextField
            control={form.control}
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            description="At least 8 characters."
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="accent-primary mt-1 size-4"
              checked={form.watch('acceptedTerms')}
              onChange={(event) =>
                form.setValue('acceptedTerms', event.currentTarget.checked, {
                  shouldValidate: true,
                })
              }
            />
            <span>
              I accept the current Mitdrone terms of service and privacy policy.
              {terms ? (
                <span className="text-muted-foreground block text-xs">
                  Terms version: {form.watch('termsVersion')}
                </span>
              ) : null}
              {form.formState.errors.acceptedTerms?.message ? (
                <span className="text-destructive block text-xs">
                  {form.formState.errors.acceptedTerms.message}
                </span>
              ) : null}
            </span>
          </label>
          {termsError ? <RootError message={termsError} /> : null}
          <Button
            type="submit"
            className="w-full"
            loading={form.formState.isSubmitting}
            disabled={!terms || Boolean(termsError)}
          >
            Create account
          </Button>
        </form>
      </Form>
      <p className="text-muted-foreground text-center text-sm">
        Already selling?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
