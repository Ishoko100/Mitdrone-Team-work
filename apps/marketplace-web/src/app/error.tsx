'use client';

import { ErrorState } from '@mitdrone/ui';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container py-16">
      <ErrorState onRetry={reset} />
    </div>
  );
}
