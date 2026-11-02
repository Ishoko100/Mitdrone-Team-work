'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import { useCreateServiceRequest } from '@mitdrone/sdk';
import { serviceRequestSchema, type ServiceRequestInput } from '@mitdrone/types';
import { Button, Form } from '@mitdrone/ui';
import { NIGERIAN_STATES } from '@mitdrone/utils';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { RootError, SelectField, TextField, TextareaField } from '@/components/forms/fields';
import { applyApiError } from '@/lib/forms';

import type { z } from 'zod';

type Input = z.input<typeof serviceRequestSchema>;
interface Cat {
  id: string;
  slug: string;
  name: string;
}

export function PostProjectForm({ categories }: { categories: Cat[] }) {
  const { isAuthenticated, isLoading } = useAuth();
  const params = useSearchParams();
  const create = useCreateServiceRequest();
  const preset = categories.find((c) => c.slug === params.get('service'));
  const form = useForm<Input, unknown, ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      categoryId: preset?.id ?? '',
      title: preset ? `${preset.name} project` : '',
      description: '',
      state: params.get('state') ?? '',
      city: params.get('city') ?? '',
      areaHectares: params.get('area') ? Number(params.get('area')) : undefined,
      budgetMajor: undefined,
      neededBy: '',
    },
  });

  if (create.isSuccess) {
    return (
      <div role="status" className="bg-success/5 space-y-3 rounded-xl border p-6">
        <CheckCircle2 className="text-success size-6" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Project posted</h2>
        <p className="text-muted-foreground">
          Verified operators will send quotes. You will see them under My projects.
        </p>
        <Button asChild>
          <Link href="/account/projects">View my projects</Link>
        </Button>
      </div>
    );
  }
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="bg-card space-y-3 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Sign in to post a project</h2>
        <p className="text-muted-foreground text-sm">
          We need an account so operators can reply to you.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link
              href={`/login?next=${encodeURIComponent(`/services/post-project?${params.toString()}`)}`}
            >
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Form {...form}>
      <form
        className="bg-card space-y-5 rounded-xl border p-6"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          create.mutateAsync(values).catch((e) => applyApiError(form, e)),
        )}
      >
        <RootError message={form.formState.errors.root?.message} />
        <SelectField
          control={form.control}
          name="categoryId"
          label="Service"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Choose a service"
        />
        <TextField control={form.control} name="title" label="Project title" />
        <TextareaField
          control={form.control}
          name="description"
          label="Describe the job"
          description="Location details, access, deadlines and anything operators should know."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="state"
            label="State"
            options={NIGERIAN_STATES}
            placeholder="Choose a state"
          />
          <TextField control={form.control} name="city" label="Town or city (optional)" />
          <TextField
            control={form.control}
            name="areaHectares"
            label="Area in hectares (optional)"
            inputMode="decimal"
          />
          <TextField
            control={form.control}
            name="budgetMajor"
            label="Budget in ₦ (optional)"
            inputMode="numeric"
          />
          <TextField
            control={form.control}
            name="neededBy"
            label="Needed by (optional)"
            type="date"
          />
        </div>
        <Button type="submit" size="lg" loading={form.formState.isSubmitting || create.isPending}>
          Post project
        </Button>
      </form>
    </Form>
  );
}
