import { Button, EmptyState } from '@mitdrone/ui';
import { Compass } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-16">
      <EmptyState
        icon={Compass}
        title="We could not find that page"
        description="The link may be broken, or the page may have been removed."
        action={
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        }
      />
    </div>
  );
}
