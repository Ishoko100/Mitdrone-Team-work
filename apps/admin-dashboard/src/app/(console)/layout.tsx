import { ConsoleShell } from '@/components/layout/console-shell';

import type { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
