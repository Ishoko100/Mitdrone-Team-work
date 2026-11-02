import { LoginScreen } from '@/components/auth/login-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return <LoginScreen />;
}
