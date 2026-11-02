'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { registerSchema, type RegisterRequest } from '@mitdrone/types';
import { Button, Form, RootError, TextField, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useForm, type Resolver } from 'react-hook-form';

import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof registerSchema>;

export function RegisterForm() {
  const { register } = useAuth();
  const form = useForm<Input, unknown, RegisterRequest>({
    resolver: zodResolver(registerSchema) as unknown as Resolver<Input, unknown, RegisterRequest>,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      accountType: 'vendor',
    },
  });
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Start selling on Mitdrone</h1>
        <p className="text-muted-foreground text-sm">
          Create your account, then verify your business to go live.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await register({ ...values, accountType: 'vendor' });
              toast.success('Account created. Let us verify your business.');
            } catch (e) {
              applyApiError(form, e);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField
            control={form.control}
            name="name"
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
            label="Phone (optional)"
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
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create seller account
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
