import { OnboardingWizard } from '@/components/onboarding/wizard';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Store setup' };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
