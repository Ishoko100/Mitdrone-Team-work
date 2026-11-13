import { VerifyEmailForm } from '@/components/auth/token-action-forms';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Verify email', robots: { index: false } };

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
