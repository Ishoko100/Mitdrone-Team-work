'use client';

import { ErrorState } from '@mitdrone/ui';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-16">
      <ErrorState onRetry={reset} />
    </div>
  );
}
