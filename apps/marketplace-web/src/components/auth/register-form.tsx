'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { api, getErrorMessage } from '@mitdrone/sdk';
import { registerSchema, type RegisterRequest, type RegistrationTerms } from '@mitdrone/types';
import { Button, Form, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { RootError, TextField } from '@/components/forms/fields';
import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof registerSchema>;

export function RegisterForm() {
  const [profile, setProfile] = useState<'buyer' | 'vendor' | 'service_provider'>('buyer');
  const [terms, setTerms] = useState<RegistrationTerms | null>(null);
  const [termsError, setTermsError] = useState<string>();
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const params = useSearchParams();
  const next = params.get('next');
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
        const key =
          profile === 'service_provider'
            ? 'serviceProvider'
            : profile === 'vendor'
              ? 'vendor'
              : 'buyer';
        form.setValue('termsVersion', result[key]);
      })
      .catch((error: unknown) => {
        if (active) setTermsError(getErrorMessage(error, 'Could not load the current terms.'));
      });
    return () => {
      active = false;
    };
  }, [form, profile]);

  if (waitingForVerification) {
    return (
      <div className="space-y-4" role="status">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground text-sm">
          We accepted your registration. Check {form.getValues('email')} for the verification email
          before signing in.
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
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          {profile === 'buyer'
            ? 'Buy, rent and hire with Buyer Protection on every order.'
            : profile === 'vendor'
              ? 'Create your account, verify your email, then submit a separate vendor application.'
              : 'Create your account, verify your email, then submit a separate service provider application.'}
        </p>
      </div>
      <div className="grid grid-cols-3 rounded-full border p-1 text-center text-sm">
        {(
          [
            ['buyer', 'Buyer'],
            ['vendor', 'Vendor'],
            ['service_provider', 'Service Provider'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={profile === value}
            className={`rounded-full px-2 py-2 font-medium transition-colors ${profile === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => {
              setProfile(value);
              const termsKey =
                value === 'service_provider'
                  ? 'serviceProvider'
                  : value === 'vendor'
                    ? 'vendor'
                    : 'buyer';
              form.setValue('termsVersion', terms?.[termsKey] ?? '');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await api.auth.register(values);
              setWaitingForVerification(true);
            } catch (error) {
              applyApiError(form, error);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField control={form.control} name="fullName" label="Full name" autoComplete="name" />
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
            label="Phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
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
        Already have an account?{' '}
        {profile === 'buyer' ? (
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        ) : (
          <a
            href={`${env.NEXT_PUBLIC_VENDOR_URL}/login`}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </a>
        )}
      </p>
    </>
  );
}
