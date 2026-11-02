'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { getErrorMessage, useCreateReview } from '@mitdrone/sdk';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RadioGroup,
  RadioGroupItem,
  Textarea,
  toast,
} from '@mitdrone/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  rating: z.string().min(1, 'Choose a rating'),
  title: z.string().min(3, 'Add a short title'),
  body: z.string().min(10, 'Tell us a little more'),
});
type Values = z.infer<typeof schema>;

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const create = useCreateReview(productId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { rating: '', title: '', body: '' },
  });

  if (!isLoading && !isAuthenticated) {
    return (
      <Button asChild variant="outline">
        <Link href={`/login?next=${encodeURIComponent(`/products/${slug}#reviews`)}`}>
          Sign in to write a review
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>Share what you liked and what could be better.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              create.mutate(
                { rating: Number(values.rating), title: values.title, body: values.body },
                {
                  onSuccess: () => {
                    toast.success('Thanks for your review', {
                      description: 'It will appear on the page shortly.',
                    });
                    form.reset();
                    setOpen(false);
                  },
                  onError: (error) => toast.error(getErrorMessage(error)),
                },
              ),
            )}
          >
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                    aria-label="Rating"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="flex cursor-pointer items-center gap-1.5 text-sm">
                        <RadioGroupItem value={String(n)} /> {n}★
                      </label>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" loading={create.isPending} className="w-full">
              Submit review
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
