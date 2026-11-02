'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { registerSchema, type RegisterRequest } from '@mitdrone/types';
import { Button, Form, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';

import { RootError, TextField } from '@/components/forms/fields';
import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof registerSchema>;

export function RegisterForm() {
  const { register } = useAuth();
  const params = useSearchParams();
  const next = params.get('next');
  const form = useForm<Input, unknown, RegisterRequest>({
    resolver: zodResolver(registerSchema) as unknown as Resolver<Input, unknown, RegisterRequest>,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      referralCode: params.get('ref') ?? '',
      accountType: 'customer',
    },
  });

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Buy, rent and hire with Buyer Protection on every order.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await register(values);
              toast.success('Account created. Welcome to Mitdrone!');
            } catch (error) {
              applyApiError(form, error);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField control={form.control} name="name" label="Full name" autoComplete="name" />
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
          <TextField control={form.control} name="referralCode" label="Referral code (optional)" />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create account
          </Button>
        </form>
      </Form>
      <p className="text-muted-foreground text-center text-sm">
        Selling on Mitdrone?{' '}
        <a
          href={`${env.NEXT_PUBLIC_VENDOR_URL}/register`}
          className="text-primary font-medium hover:underline"
        >
          Register as a seller
        </a>
      </p>
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
