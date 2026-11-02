import { SettingsView } from '@/components/settings/settings-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <SettingsView />;
}
