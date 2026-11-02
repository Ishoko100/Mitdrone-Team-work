import { Info } from 'lucide-react';

import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="border-warning/40 bg-warning/10 flex gap-3 rounded-lg border p-4 text-sm"
    >
      <Info className="text-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
