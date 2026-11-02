import { Badge, Button } from '@mitdrone/ui';
import { BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from './add-to-cart-button';
import { Price } from './price';
import { RatingStars } from './rating-stars';

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
  const lowStock =
    product.inventory.quantity > 0 &&
    product.inventory.quantity <= product.inventory.lowStockThreshold;

  return (
    <article className="bg-card shadow-soft hover:shadow-card group relative flex flex-col overflow-hidden rounded-xl border transition-shadow">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="bg-muted relative block aspect-[4/3] overflow-hidden"
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
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.vendor ? (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <span className="truncate">{product.vendor.name}</span>
            {product.vendor.verified ? (
              <BadgeCheck className="text-primary size-3.5 shrink-0" aria-label="Verified seller" />
            ) : null}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.title}
          </Link>
        </h3>
        <RatingStars rating={product.rating} count={product.reviewCount} />
        <div className="mt-auto space-y-3 pt-1">
          {isRental && product.rental ? (
            <Price price={product.rental.daily} suffix="/ day" />
          ) : (
            <Price price={product.price} compareAt={product.compareAtPrice} />
          )}
          {lowStock ? (
            <p className="text-warning text-xs font-medium">
              Only {product.inventory.quantity} left
            </p>
          ) : null}
          <div className="relative z-10">
            {isRental || product.variants.length > 0 ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={href}>{isRental ? 'Check availability' : 'Choose options'}</Link>
              </Button>
            ) : (
              <AddToCartButton product={product} size="sm" variant="outline" className="w-full" />
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
      className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 ${className ?? ''}`}
    >
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <div className="flex w-full">
            <ProductCard product={product} priority={index < 4} />
          </div>
        </li>
      ))}
    </ul>
  );
}
