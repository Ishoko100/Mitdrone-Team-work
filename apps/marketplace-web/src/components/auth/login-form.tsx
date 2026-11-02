'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { loginSchema, type LoginRequest } from '@mitdrone/types';
import { Button, Form, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { RootError, TextField } from '@/components/forms/fields';
import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

export function LoginForm() {
  const { login } = useAuth();
  const next = useSearchParams().get('next');
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to track orders, manage addresses and earn referral rewards.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await login(values);
              toast.success('Welcome back');
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
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <div className="text-right text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      </Form>
      {env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' ? (
        <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
          <p className="font-medium">Demo account</p>
          <p className="text-muted-foreground">ibrahim@mitdrone.test · Password123!</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('email', 'ibrahim@mitdrone.test');
              form.setValue('password', 'Password123!');
            }}
          >
            Fill demo details
          </Button>
        </div>
      ) : null}
      <p className="text-muted-foreground text-center text-sm">
        New to Mitdrone?{' '}
        <Link href={registerHref} className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
