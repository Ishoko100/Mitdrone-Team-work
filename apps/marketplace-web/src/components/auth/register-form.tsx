'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { api } from '@mitdrone/sdk';
import { registerSchema, type RegisterRequest } from '@mitdrone/types';
import { Button, Form, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { RootError, TextField } from '@/components/forms/fields';
import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof registerSchema>;

export function RegisterForm() {
  const { register } = useAuth();
  const [profile, setProfile] = useState<'buyer' | 'vendor' | 'service_provider'>('buyer');
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
      vendorType: undefined,
    },
  });

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          {profile === 'buyer'
            ? 'Buy, rent and hire with Buyer Protection on every order.'
            : profile === 'vendor'
              ? 'Create a vendor profile to list and sell products on Mitdrone.'
              : 'Create a service provider profile to offer drone services on Mitdrone.'}
        </p>
      </div>
      <div className="grid grid-cols-3 rounded-full border p-1 text-center text-sm">
        {([
          ['buyer', 'Buyer'],
          ['vendor', 'Vendor'],
          ['service_provider', 'Service Provider'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={profile === value}
            className={`rounded-full px-2 py-2 font-medium transition-colors ${profile === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => {
              setProfile(value);
              form.setValue('accountType', value === 'buyer' ? 'customer' : 'vendor');
              form.setValue(
                'vendorType',
                value === 'vendor'
                  ? 'individual_seller'
                  : value === 'service_provider'
                    ? value
                    : undefined,
              );
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
              if (profile === 'buyer') {
                await register(values);
                toast.success('Account created. Welcome to Mitdrone!');
              } else {
                await api.auth.register(values);
                toast.success(
                  profile === 'vendor'
                    ? 'Vendor profile created. Sign in from Seller Log in to continue setup.'
                    : 'Service provider profile created. Sign in from Seller Log in to continue setup.',
                );
              }
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
            {profile === 'buyer'
              ? 'Create account'
              : profile === 'vendor'
                ? 'Create vendor account'
                : 'Create service provider account'}
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
