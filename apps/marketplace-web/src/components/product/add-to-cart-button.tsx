'use client';

import { Button, toast, type ButtonProps } from '@mitdrone/ui';
import { ShoppingCart } from 'lucide-react';

import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

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
 * Optimistic by design: the cart is local state, so the item appears instantly and the mini-cart
 * opens. Price and stock are re-validated by the API at checkout.
 */
export function AddToCartButton({
  product,
  productVariant: variant,
  quantity = 1,
  label = 'Add to cart',
  ...props
}: Props) {
  const add = useCartStore((s) => s.add);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const source = variant ?? product;
  const stock = source.inventory.quantity;

  return (
    <Button
      disabled={stock <= 0}
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
        setCartOpen(true);
      }}
      {...props}
    >
      <ShoppingCart aria-hidden="true" />
      {stock <= 0 ? 'Out of stock' : label}
    </Button>
  );
}
