import { ProductForm } from '@/components/products/product-form';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProductForm productId={(await params).id} />;
}
