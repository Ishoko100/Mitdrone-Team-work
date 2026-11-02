import { Button, EmptyState } from '@mitdrone/ui';
import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-16">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page does not exist in the Seller Hub."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
