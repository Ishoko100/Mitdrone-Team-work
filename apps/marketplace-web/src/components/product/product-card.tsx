import { Badge, Button } from '@mitdrone/ui';
import { BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from './add-to-cart-button';
import { Price } from './price';
import { RatingStars } from './rating-stars';
import { WishlistButton } from './wishlist-button';

import type { Product } from '@mitdrone/types';

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const href = `/products/${product.slug}`;
  const image = product.images[0];
  const isRental = product.listingType === 'rent';
  const hasDeal = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const rentalCompareAt = product.rental
    ? { ...product.rental.daily, amount: Math.round(product.rental.daily.amount * 1.1) }
    : undefined;
  const lowStock =
    product.inventory.quantity > 0 &&
    product.inventory.quantity <= product.inventory.lowStockThreshold;

  return (
    <article className="bg-card shadow-soft hover:shadow-card group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border transition-shadow">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="bg-muted relative block aspect-[4/5] overflow-hidden"
      >
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            priority={priority}
            sizes="(min-width:1280px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {hasDeal ? (
            <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
              Deal
            </Badge>
          ) : null}
          {isRental ? (
            <Badge variant="default" className="bg-background/90">
              For rent
            </Badge>
          ) : null}
          {product.condition !== 'new' ? (
            <Badge variant="secondary" className="bg-background/90 capitalize">
              {product.condition}
            </Badge>
          ) : null}
        </div>
      </Link>
      <WishlistButton productId={product.id} title={product.title} />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-muted-foreground flex min-h-4 items-center gap-1 text-xs">
          {product.vendor ? (
            <p className="flex min-w-0 items-center gap-1">
              <span className="truncate">{product.vendor.name}</span>
              {product.vendor.verified ? (
                <BadgeCheck
                  className="text-primary size-3.5 shrink-0"
                  aria-label="Verified seller"
                />
              ) : null}
            </p>
          ) : null}
        </div>
        <h3 className="line-clamp-2 min-h-9 text-sm font-medium leading-tight">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.title}
          </Link>
        </h3>
        <div className="flex min-h-4 items-center">
          <RatingStars rating={product.rating} count={product.reviewCount} />
        </div>
        <div className="mt-auto space-y-2 pt-0">
          {isRental && product.rental ? (
            <Price price={product.rental.daily} compareAt={rentalCompareAt} suffix="/ day" />
          ) : (
            <Price price={product.price} compareAt={product.compareAtPrice} />
          )}
          {lowStock ? (
            <p className="text-warning text-xs font-medium">
              Only {product.inventory.quantity} left
            </p>
          ) : null}
          <div className="relative z-10 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 px-2">
              <Link href={href}>Details</Link>
            </Button>
            {isRental ? (
              <Button asChild size="sm" className="flex-1 px-2">
                <Link href={href}>{isRental ? 'Check availability' : 'Add to cart'}</Link>
              </Button>
            ) : (
              <AddToCartButton
                product={product}
                size="sm"
                className="flex-1 px-2"
                label="Add to Cart"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <ul
      className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5 ${className ?? ''}`}
    >
      {products.map((product, index) => (
        <li key={product.id} className="flex min-w-0">
          <div className="flex h-full w-full min-w-0">
            <ProductCard product={product} priority={index < 5} />
          </div>
        </li>
      ))}
    </ul>
  );
}
