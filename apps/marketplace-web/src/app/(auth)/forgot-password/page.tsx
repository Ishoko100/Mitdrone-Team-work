import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
