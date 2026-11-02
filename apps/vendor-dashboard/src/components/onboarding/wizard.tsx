'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  useSaveKyc,
  useSubmitKyc,
  useUpdateBank,
  useUpdateVendorSettings,
  useVendorKyc,
  useVendorSettings,
} from '@mitdrone/sdk';
import {
  Badge,
  Button,
  Form,
  PageHeader,
  RootError,
  SelectField,
  Skeleton,
  TextField,
  TextareaField,
  cn,
  toast,
} from '@mitdrone/ui';
import { NIGERIAN_STATES } from '@mitdrone/utils';
import { CheckCircle2, Clock, FileCheck2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { applyApiError } from '@/lib/forms';

import type { BankDetails, KYCDocumentType, Vendor, VendorKYC } from '@mitdrone/types';

const STEPS = ['Store profile', 'Verification', 'Payout details', 'Review & submit'] as const;
const BANKS = ['Access Bank', 'First Bank', 'GTBank', 'Kuda', 'UBA', 'Zenith Bank'];
const DOCS: { type: KYCDocumentType; label: string; required: boolean; hint: string }[] = [
  {
    type: 'cac_certificate',
    label: 'CAC certificate',
    required: true,
    hint: 'Business registration (or RC number document)',
  },
  {
    type: 'government_id',
    label: 'Director or owner ID',
    required: true,
    hint: 'NIN slip, passport or driver’s licence',
  },
  {
    type: 'ncaa_permit',
    label: 'NCAA permit',
    required: false,
    hint: 'Recommended for drone operators and dealers',
  },
  {
    type: 'proof_of_address',
    label: 'Proof of address',
    required: false,
    hint: 'Utility bill from the last 3 months',
  },
  { type: 'tax_id', label: 'Tax ID (TIN)', required: false, hint: 'Optional' },
];

const profileSchema = z.object({
  name: z.string().min(2, 'Enter your store name'),
  description: z.string().min(20, 'Tell buyers a bit more (20+ characters)'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Choose a state'),
  returnPolicy: z.string().min(10, 'Describe your return policy'),
});
const kycSchema = z.object({
  legalName: z.string().min(2, 'Enter the registered business name'),
  registrationNumber: z.string().optional(),
});
const bankSchema = z.object({
  bankName: z.string().min(2, 'Choose your bank'),
  accountName: z.string().min(2, 'Required'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
});

const hasRequiredDocs = (kyc: VendorKYC) =>
  DOCS.filter((d) => d.required).every((d) => kyc.documents.some((x) => x.type === d.type));
const profileDone = (v: Vendor) =>
  v.name.length >= 2 && v.description.length >= 20 && Boolean(v.city) && Boolean(v.state);

function ProfileStep({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const update = useUpdateVendorSettings(vendor.id);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: vendor.name,
      description: vendor.description,
      phone: vendor.phone ?? '',
      city: vendor.city,
      state: vendor.state,
      returnPolicy: vendor.returnPolicy,
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await update.mutateAsync(v);
            toast.success('Store profile saved');
            onDone();
          } catch (e) {
            applyApiError(form, e);
          }
        })}
      >
        <RootError message={form.formState.errors.root?.message} />
        <TextField control={form.control} name="name" label="Store name" />
        <TextareaField
          control={form.control}
          name="description"
          label="About your store"
          description="Shown on your public store page."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="phone" label="Business phone" type="tel" />
          <TextField control={form.control} name="city" label="City" />
        </div>
        <SelectField
          control={form.control}
          name="state"
          label="State"
          options={NIGERIAN_STATES}
          placeholder="Choose a state"
        />
        <TextareaField control={form.control} name="returnPolicy" label="Return policy" rows={3} />
        <Button type="submit" loading={form.formState.isSubmitting}>
          Save and continue
        </Button>
      </form>
    </Form>
  );
}

function DocRow({
  doc,
  kyc,
  vendorId,
}: {
  doc: (typeof DOCS)[number];
  kyc: VendorKYC;
  vendorId: string;
}) {
  const save = useSaveKyc(vendorId);
  const input = useRef<HTMLInputElement>(null);
  const existing = kyc.documents.find((d) => d.type === doc.type);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <FileCheck2
        className={cn('size-5', existing ? 'text-success' : 'text-muted-foreground')}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {doc.label} {doc.required ? <Badge variant="secondary">Required</Badge> : null}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {existing ? existing.fileName : doc.hint}
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="sr-only"
        aria-label={`Upload ${doc.label}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          // Mock: only the file name is sent. A real backend would receive the upload.
          const documents = [
            ...kyc.documents
              .filter((d) => d.type !== doc.type)
              .map((d) => ({ type: d.type, fileName: d.fileName })),
            { type: doc.type, fileName: file.name },
          ];
          save.mutate(
            { documents },
            {
              onSuccess: () => toast.success(`${doc.label} uploaded`),
              onError: (err) => toast.error(getErrorMessage(err)),
            },
          );
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={save.isPending}
        onClick={() => input.current?.click()}
      >
        <Upload /> {existing ? 'Replace' : 'Upload'}
      </Button>
    </li>
  );
}

function KycStep({
  vendorId,
  kyc,
  onDone,
}: {
  vendorId: string;
  kyc: VendorKYC;
  onDone: () => void;
}) {
  const save = useSaveKyc(vendorId);
  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: { legalName: kyc.legalName, registrationNumber: kyc.registrationNumber ?? '' },
  });
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (v) => {
            if (!hasRequiredDocs(kyc))
              return form.setError('root', { message: 'Upload the required documents first.' });
            try {
              await save.mutateAsync(v);
              onDone();
            } catch (e) {
              applyApiError(form, e);
            }
          })}
        >
          <RootError message={form.formState.errors.root?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="legalName" label="Registered business name" />
            <TextField
              control={form.control}
              name="registrationNumber"
              label="RC number (optional)"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Documents</legend>
            <ul className="space-y-2">
              {DOCS.map((d) => (
                <DocRow key={d.type} doc={d} kyc={kyc} vendorId={vendorId} />
              ))}
            </ul>
          </fieldset>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save and continue
          </Button>
        </form>
      </Form>
    </div>
  );
}

function BankStep({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const update = useUpdateBank(vendor.id);
  const form = useForm<BankDetails>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: vendor.bank?.bankName ?? '',
      accountName: vendor.bank?.accountName ?? '',
      accountNumber: vendor.bank?.accountNumber ?? '',
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await update.mutateAsync(v);
            toast.success('Payout details saved');
            onDone();
          } catch (e) {
            applyApiError(form, e);
          }
        })}
      >
        <RootError message={form.formState.errors.root?.message} />
        <SelectField
          control={form.control}
          name="bankName"
          label="Bank"
          options={BANKS}
          placeholder="Choose your bank"
        />
        <TextField
          control={form.control}
          name="accountName"
          label="Account name"
          description="Must match your registered business name."
        />
        <TextField
          control={form.control}
          name="accountNumber"
          label="Account number"
          inputMode="numeric"
        />
        <Button type="submit" loading={form.formState.isSubmitting}>
          Save and continue
        </Button>
      </form>
    </Form>
  );
}

function ReviewStep({ vendor, kyc }: { vendor: Vendor; kyc: VendorKYC }) {
  const submit = useSubmitKyc(vendor.id);
  const checks = [
    ['Store profile', profileDone(vendor)],
    ['Business verification and documents', kyc.legalName.length >= 2 && hasRequiredDocs(kyc)],
    ['Payout details', Boolean(vendor.bank)],
  ] as const;
  const ready = checks.every(([, ok]) => ok);
  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {checks.map(([label, ok]) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            {ok ? (
              <CheckCircle2 className="text-success size-5" aria-hidden="true" />
            ) : (
              <Clock className="text-warning size-5" aria-hidden="true" />
            )}
            <span>{label}</span>
            <span className="sr-only">{ok ? 'complete' : 'incomplete'}</span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        We review verification within two business days. You will be able to list products once
        approved.
      </p>
      <Button
        disabled={!ready}
        loading={submit.isPending}
        onClick={() =>
          submit.mutate(undefined, {
            onSuccess: () => toast.success('Submitted for review'),
            onError: (e) => toast.error(getErrorMessage(e)),
          })
        }
      >
        Submit for review
      </Button>
    </div>
  );
}

export function OnboardingWizard() {
  const { user, can } = useAuth();
  const vendorQ = useVendorSettings(user?.vendorId);
  const kycQ = useVendorKyc(user?.vendorId);
  const [step, setStep] = useState<number>();
  const vendor = vendorQ.data;
  const kyc = kycQ.data;

  if (!vendor || !kyc)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  const current =
    step ??
    (!profileDone(vendor)
      ? 0
      : !(kyc.legalName && hasRequiredDocs(kyc))
        ? 1
        : !vendor.bank
          ? 2
          : 3);

  if (vendor.status === 'approved') {
    return (
      <div className="bg-success/5 space-y-4 rounded-xl border p-6" role="status">
        <CheckCircle2 className="text-success size-8" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Your store is live</h1>
        <p className="text-muted-foreground">
          Verification is complete. You can list products and receive orders.
        </p>
        <Button asChild>
          <Link href="/products/new">Add your first product</Link>
        </Button>
      </div>
    );
  }
  if (vendor.status === 'pending_review') {
    return (
      <div className="bg-card space-y-4 rounded-xl border p-6" role="status">
        <Clock className="text-warning size-8" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Under review</h1>
        <p className="text-muted-foreground">
          Thanks for submitting. We will email you as soon as a decision is made. This usually takes
          up to two business days.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }
  if (vendor.status === 'suspended')
    return (
      <div role="alert" className="border-destructive/30 bg-destructive/5 rounded-xl border p-6">
        <h1 className="text-2xl font-semibold">Store suspended</h1>
        <p className="text-muted-foreground">Contact Mitdrone support to resolve this.</p>
      </div>
    );

  const owner = can('vendor.settings.edit');
  return (
    <>
      <PageHeader
        title="Set up your store"
        description="Four short steps to start selling on Mitdrone."
      />
      {vendor.status === 'rejected' && kyc.rejectionReason ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm"
        >
          <p className="font-medium">Your last submission was not approved</p>
          <p className="text-muted-foreground">{kyc.rejectionReason}</p>
        </div>
      ) : null}
      {!owner ? (
        <p role="status" className="bg-muted rounded-lg border p-4 text-sm">
          Only the store owner can complete verification.
        </p>
      ) : (
        <>
          <ol className="flex flex-wrap gap-2 text-sm" aria-label="Setup steps">
            {STEPS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={current === i ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1.5',
                    current === i
                      ? 'border-primary bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="bg-primary/10 flex size-5 items-center justify-center rounded-full text-xs">
                    {i + 1}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
          <section aria-label={STEPS[current]} className="bg-card max-w-2xl rounded-xl border p-6">
            {current === 0 ? <ProfileStep vendor={vendor} onDone={() => setStep(1)} /> : null}
            {current === 1 ? (
              <KycStep vendorId={vendor.id} kyc={kyc} onDone={() => setStep(2)} />
            ) : null}
            {current === 2 ? <BankStep vendor={vendor} onDone={() => setStep(3)} /> : null}
            {current === 3 ? <ReviewStep vendor={vendor} kyc={kyc} /> : null}
          </section>
        </>
      )}
    </>
  );
}
