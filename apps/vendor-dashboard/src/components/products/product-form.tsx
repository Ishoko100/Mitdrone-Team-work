'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  isApiError,
  useCreateProduct,
  useUpdateProduct,
  useVendorProduct,
} from '@mitdrone/sdk';
import { productFormSchema, type Product, type ProductFormValues } from '@mitdrone/types';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  PageHeader,
  RootError,
  SelectField,
  Skeleton,
  StatusBadge,
  TextField,
  TextareaField,
  toast,
} from '@mitdrone/ui';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';

import { applyApiError } from '@/lib/forms';

import { CategoryField, NumberField, TagsField } from './form-parts';

import type { z } from 'zod';

// TipTap is only downloaded on the pages that edit descriptions.
const RichTextEditor = dynamic(() => import('./rich-text-editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

type Input = z.input<typeof productFormSchema>;

const KINDS = [
  { value: 'drone', label: 'Drone' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'spare_part', label: 'Spare part' },
  { value: 'payload', label: 'Payload' },
  { value: 'equipment', label: 'Equipment' },
];
const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
];

function toFormValues(p?: Product): Input {
  return {
    title: p?.title ?? '',
    shortDescription: p?.shortDescription ?? '',
    description: p?.description ?? '',
    kind: p?.kind ?? 'drone',
    listingType: 'sale',
    condition: p?.condition ?? 'new',
    brand: p?.brand ?? '',
    categoryIds: p?.categoryIds ?? [],
    priceMajor: p ? p.price.amount / 100 : undefined,
    compareAtPriceMajor: p?.compareAtPrice ? p.compareAtPrice.amount / 100 : undefined,
    sku: p?.inventory.sku ?? '',
    quantity: p?.inventory.quantity ?? 1,
    lowStockThreshold: p?.inventory.lowStockThreshold ?? 2,
    tags: p?.tags ?? [],
  } as Input;
}

function Editor({ product }: { product?: Product }) {
  const { user } = useAuth();
  const router = useRouter();
  const v = user?.vendorId ?? '';
  const create = useCreateProduct(v);
  const update = useUpdateProduct(v, product?.id ?? '');
  const form = useForm<Input, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema) as unknown as Resolver<
      Input,
      unknown,
      ProductFormValues
    >,
    defaultValues: toFormValues(product),
  });
  const notApproved = form.formState.errors.root?.message?.toLowerCase().includes('approved');

  return (
    <Form {...form}>
      <form
        noValidate
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            if (product) await update.mutateAsync({ ...values, listingType: 'sale' });
            else await create.mutateAsync({ ...values, listingType: 'sale' });
            toast.success(
              product ? 'Product updated' : 'Product submitted for review',
              product ? undefined : { description: 'It goes live once Mitdrone approves it.' },
            );
            router.push('/products');
          } catch (e) {
            if (isApiError(e) && e.code === 'vendor_not_approved')
              form.setError('root', { message: getErrorMessage(e) });
            else applyApiError(form, e);
          }
        })}
      >
        <PageHeader
          title={product ? 'Edit product' : 'New product'}
          description={
            product ? undefined : 'New listings are reviewed before they appear on the storefront.'
          }
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/products">Cancel</Link>
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                {product ? 'Save changes' : 'Submit for review'}
              </Button>
            </>
          }
        />
        <RootError message={form.formState.errors.root?.message} />
        {notApproved ? (
          <p className="text-sm">
            <Link href="/onboarding" className="text-primary font-medium hover:underline">
              Finish store verification
            </Link>{' '}
            to start listing.
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextField
                  control={form.control}
                  name="title"
                  label="Title"
                  placeholder="e.g. DJI Mavic 3 Enterprise"
                />
                <TextareaField
                  control={form.control}
                  name="shortDescription"
                  label="Short description"
                  rows={2}
                  description="One or two sentences shown in listings and search results."
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          invalid={Boolean(form.formState.errors.description)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  Image upload is not part of this demo build. A placeholder illustration is used
                  automatically.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-6">
            {product ? (
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <StatusBadge status={product.status} />
                  {product.moderationNote ? (
                    <p className="text-muted-foreground text-sm">{product.moderationNote}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Pricing and stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NumberField control={form.control} name="priceMajor" label="Price" prefix="₦" />
                <NumberField
                  control={form.control}
                  name="compareAtPriceMajor"
                  label="Compare-at price (optional)"
                  prefix="₦"
                  description="Shown crossed out to highlight a discount."
                />
                <TextField control={form.control} name="sku" label="SKU" />
                <div className="grid grid-cols-2 gap-3">
                  <NumberField control={form.control} name="quantity" label="In stock" />
                  <NumberField
                    control={form.control}
                    name="lowStockThreshold"
                    label="Low-stock alert"
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  control={form.control}
                  name="kind"
                  label="Product type"
                  options={KINDS}
                />
                <SelectField
                  control={form.control}
                  name="condition"
                  label="Condition"
                  options={CONDITIONS}
                />
                <TextField control={form.control} name="brand" label="Brand" />
                <CategoryField control={form.control} name="categoryIds" />
                <TagsField control={form.control} name="tags" />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

export function ProductForm({ productId }: { productId?: string }) {
  const { user } = useAuth();
  const existing = useVendorProduct(user?.vendorId, productId);
  if (!productId) return <Editor />;
  if (existing.isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (existing.isError)
    return (
      <ErrorState
        title="We could not load this product"
        description={getErrorMessage(existing.error)}
        onRetry={() => existing.refetch()}
      />
    );
  return <Editor product={existing.data} />;
}
