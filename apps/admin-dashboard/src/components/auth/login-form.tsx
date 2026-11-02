'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GuestOnly, useAuth } from '@mitdrone/auth';
import { loginSchema, type LoginRequest } from '@mitdrone/types';
import { Button, Form, RootError, Skeleton, TextField, toast } from '@mitdrone/ui';
import { useForm } from 'react-hook-form';

import { Brand } from '@/components/layout/brand';
import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

function Form_() {
  const { login } = useAuth();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="text-muted-foreground text-sm">Restricted to Mitdrone staff.</p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await login(v);
              toast.success('Welcome back');
            } catch (e) {
              applyApiError(form, e);
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
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      </Form>
      {env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' ? (
        <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
          <p className="font-medium">
            Demo accounts{' '}
            <span className="text-muted-foreground font-normal">(password Password123!)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Super admin', 'superadmin@mitdrone.test'],
              ['Admin', 'admin@mitdrone.test'],
              ['Support', 'support@mitdrone.test'],
            ].map(([label, email]) => (
              <Button
                key={email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue('email', email ?? '');
                  form.setValue('password', 'Password123!');
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LoginScreen() {
  return (
    <main
      id="main"
      className="from-accent/60 to-background flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b px-4 py-10"
    >
      <Brand />
      <div className="bg-card shadow-card w-full max-w-md space-y-6 rounded-2xl border p-6 sm:p-8">
        <GuestOnly redirectTo="/dashboard" fallback={<Skeleton className="h-64 w-full" />}>
          <Form_ />
        </GuestOnly>
      </div>
    </main>
  );
}
