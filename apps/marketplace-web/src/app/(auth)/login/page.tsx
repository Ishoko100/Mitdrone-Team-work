import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
