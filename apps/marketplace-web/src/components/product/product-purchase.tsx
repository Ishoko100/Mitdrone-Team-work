'use client';

import { Button, cn } from '@mitdrone/ui';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useCartStore } from '@/stores/cart';

import { AddToCartButton } from './add-to-cart-button';
import { Price } from './price';

import type { Product } from '@mitdrone/types';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId);
  const source = variant ?? product;
  const stock = source.inventory.quantity;
  const maxQty = Math.max(1, Math.min(stock, 10));
  const low = stock > 0 && stock <= product.inventory.lowStockThreshold;

  function buyNow() {
    add(
      {
        productId: product.id,
        ...(variant ? { variantId: variant.id } : {}),
        vendorId: product.vendorId,
        title: variant ? `${product.title} (${variant.name})` : product.title,
        slug: product.slug,
        ...(product.images[0] ? { imageUrl: product.images[0].url } : {}),
        unitPrice: source.price,
        maxQuantity: stock,
      },
      quantity,
    );
    router.push('/checkout');
  }

  return (
    <div className="space-y-5">
      <Price price={source.price} compareAt={variant ? undefined : product.compareAtPrice} large />

      {product.variants.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Package</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Package">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={v.id === variantId}
                disabled={v.inventory.quantity <= 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                }}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50',
                  v.id === variantId
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'hover:bg-muted',
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <p
        className={cn(
          'text-sm font-medium',
          stock <= 0 ? 'text-destructive' : low ? 'text-warning' : 'text-success',
        )}
        role="status"
      >
        {stock <= 0 ? 'Out of stock' : low ? `Only ${stock} left in stock` : 'In stock'}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex items-center rounded-md border"
          role="group"
          aria-label="Quantity"
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => q - 1)}
          >
            <Minus />
          </Button>
          <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={quantity >= maxQty || stock <= 0}
            onClick={() => setQuantity((q) => q + 1)}
          >
            <Plus />
          </Button>
        </div>
        <AddToCartButton
          product={product}
          productVariant={variant}
          quantity={quantity}
          size="lg"
          className="flex-1 sm:flex-none"
        />
        <Button size="lg" variant="outline" disabled={stock <= 0} onClick={buyNow}>
          Buy now
        </Button>
      </div>
    </div>
  );
}
