'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@mitdrone/sdk';
import {
  resetPasswordSchema,
  verifyEmailSchema,
  type ResetPasswordRequest,
  type VerifyEmailRequest,
} from '@mitdrone/types';
import { Button, Form, toast } from '@mitdrone/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RootError, TextField } from '@/components/forms/fields';
import { applyApiError } from '@/lib/forms';

const verificationFormSchema = verifyEmailSchema.extend({
  email: z.string().email('Enter a valid email address'),
});
type VerificationFormInput = z.input<typeof verificationFormSchema>;

const passwordResetFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type PasswordResetFormInput = z.input<typeof passwordResetFormSchema>;

export function VerifyEmailForm() {
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const form = useForm<VerificationFormInput>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: { email: '', token: '', password: '' },
  });

  if (verified) {
    return (
      <div className="space-y-4 text-center" role="status">
        <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
        <p className="text-muted-foreground text-sm">
          Your email is verified. Sign in to continue. Vendor approval is a separate process.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground text-sm">
          Enter the verification token from your email and the password you chose at registration.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const request: VerifyEmailRequest = {
                token: values.token,
                password: values.password,
              };
              await api.auth.verifyEmail(request);
              setVerified(true);
            } catch (error) {
              applyApiError(form, error);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField control={form.control} name="email" label="Email" type="email" />
          <TextField
            control={form.control}
            name="token"
            label="Verification token"
            autoComplete="one-time-code"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password used at registration"
            type="password"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Verify email
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            loading={resending}
            onClick={async () => {
              const email = form.getValues('email');
              const valid = z.string().email().safeParse(email).success;
              if (!valid) {
                form.setError('email', { message: 'Enter your email address to resend the link' });
                return;
              }
              setResending(true);
              try {
                await api.auth.resendVerification({ email });
                toast.success('If the account can be verified, a new email will be sent.');
              } catch (error) {
                applyApiError(form, error);
              } finally {
                setResending(false);
              }
            }}
          >
            Resend verification email
          </Button>
        </form>
      </Form>
    </>
  );
}

export function ResetPasswordForm() {
  const [reset, setReset] = useState(false);
  const form = useForm<PasswordResetFormInput>({
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: { token: '', password: '', confirmPassword: '' },
  });

  if (reset) {
    return (
      <div className="space-y-4 text-center" role="status">
        <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
        <p className="text-muted-foreground text-sm">You can now sign in with your new password.</p>
        <Button asChild className="w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-muted-foreground text-sm">
          Enter the reset token from your email and a password of at least 15 characters.
        </p>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const request: ResetPasswordRequest = {
                token: values.token,
                password: values.password,
              };
              await api.auth.resetPassword(request);
              setReset(true);
            } catch (error) {
              applyApiError(form, error);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <TextField control={form.control} name="token" label="Password reset token" />
          <TextField
            control={form.control}
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Reset password
          </Button>
        </form>
      </Form>
    </>
  );
}
