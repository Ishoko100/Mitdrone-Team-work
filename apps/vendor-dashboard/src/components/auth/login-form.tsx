'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { loginSchema, type LoginRequest } from '@mitdrone/types';
import { Button, Form, RootError, TextField, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { env } from '@/lib/env';
import { applyApiError } from '@/lib/forms';

export function LoginForm() {
  const { login } = useAuth();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to your store</h1>
        <p className="text-muted-foreground text-sm">Manage products, orders and payouts.</p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await login(values);
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
          <p className="font-medium">Demo accounts</p>
          <p className="text-muted-foreground">
            Owner: vendor@mitdrone.test · Staff: staff@mitdrone.test
            <br />
            Pending approval: owner@newwave-aviation.mitdrone.test
            <br />
            Password: Password123!
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Owner', 'vendor@mitdrone.test'],
              ['Staff', 'staff@mitdrone.test'],
              ['Pending', 'owner@newwave-aviation.mitdrone.test'],
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
      <p className="text-muted-foreground text-center text-sm">
        New seller?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create a seller account
        </Link>
      </p>
    </>
  );
}
