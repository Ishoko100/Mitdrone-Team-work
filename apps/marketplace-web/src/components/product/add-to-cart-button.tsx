'use client';

import { Button, cn, toast, type ButtonProps } from '@mitdrone/ui';
import { Check, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { useCartStore } from '@/stores/cart';

import type { Product, Variant } from '@mitdrone/types';

export type CartProduct = Pick<
  Product,
  'id' | 'slug' | 'title' | 'vendorId' | 'images' | 'price' | 'inventory'
>;

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {
  product: CartProduct;
  productVariant?: Pick<Variant, 'id' | 'name' | 'price' | 'inventory'> | undefined;
  quantity?: number;
  label?: string;
}

/**
 * Optimistic by design: the item appears in the local cart immediately. Price and stock are
 * re-validated by the API at checkout.
 */
export function AddToCartButton({
  product,
  productVariant: variant,
  quantity = 1,
  label = 'Add to cart',
  className,
  ...props
}: Props) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);
  const source = variant ?? product;
  const stock = source.inventory.quantity;

  return (
    <Button
      disabled={stock <= 0}
      className={cn(
        'relative transition-all duration-200 active:scale-[0.97]',
        added && 'bg-emerald-600 text-white hover:bg-emerald-700',
        className,
      )}
      onClick={() => {
        const result = add(
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
        if (result.capped) toast.info(`Only ${stock} available. We added the maximum.`);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      {...props}
    >
      {added ? (
        <Check className="animate-in zoom-in-50 duration-200" aria-hidden="true" />
      ) : (
        <ShoppingCart aria-hidden="true" />
      )}
      {stock <= 0 ? 'Out of stock' : added ? 'Added!' : label}
    </Button>
  );
}
