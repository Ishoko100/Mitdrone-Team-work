'use client';

import { Button } from '@mitdrone/ui';
import { Heart } from 'lucide-react';

import { useWishlistStore } from '@/stores/wishlist';

export function WishlistButton({ productId, title }: { productId: string; title: string }) {
  const saved = useWishlistStore((state) => state.productIds.includes(productId));
  const toggle = useWishlistStore((state) => state.toggle);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="absolute right-2 top-2 z-20 size-9 rounded-full bg-background/90 shadow"
      aria-label={saved ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
      aria-pressed={saved}
      onClick={() => toggle(productId)}
    >
      <Heart className={saved ? 'size-4 fill-red-500 text-red-500' : 'size-4'} aria-hidden="true" />
    </Button>
  );
}
