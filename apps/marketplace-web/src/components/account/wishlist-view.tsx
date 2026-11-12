'use client';

import { useProduct } from '@mitdrone/sdk';
import { Button, Skeleton } from '@mitdrone/ui';
import Link from 'next/link';

import { ProductCard } from '@/components/product/product-card';
import { useWishlistStore } from '@/stores/wishlist';

export function WishlistView() {
  const productIds = useWishlistStore((state) => state.productIds);

  return (
    <div className="container py-10">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Wish List</h1>
        <p className="text-muted-foreground">Products you have saved for later.</p>
      </header>
      {productIds.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {productIds.map((productId) => (
            <li key={productId} className="min-w-0">
              <WishlistProduct productId={productId} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-card flex flex-col items-start gap-4 rounded-xl border p-6">
          <p className="text-muted-foreground">Your wish list is empty.</p>
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function WishlistProduct({ productId }: { productId: string }) {
  const { data, isPending, isError } = useProduct(productId);

  if (isPending) return <Skeleton className="aspect-[4/7] w-full rounded-xl" />;
  if (isError || !data) return null;
  return <ProductCard product={data} />;
}
