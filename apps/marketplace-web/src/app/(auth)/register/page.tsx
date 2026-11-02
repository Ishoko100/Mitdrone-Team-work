import { Suspense } from 'react';

import { RegisterForm } from '@/components/auth/register-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create account', robots: { index: false } };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
