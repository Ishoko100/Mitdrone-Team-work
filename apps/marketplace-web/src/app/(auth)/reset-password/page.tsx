import { ResetPasswordForm } from '@/components/auth/token-action-forms';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
