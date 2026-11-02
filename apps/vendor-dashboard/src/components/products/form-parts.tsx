'use client';

import { useCategories } from '@mitdrone/sdk';
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@mitdrone/ui';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';

/** Number input that maps an empty box to undefined, so optional numeric fields validate correctly. */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  prefix,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  prefix?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            {prefix ? (
              <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                {prefix}
              </span>
            ) : null}
            <FormControl>
              <Input
                inputMode="decimal"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                onBlur={field.onBlur}
                className={prefix ? 'pl-7' : undefined}
              />
            </FormControl>
          </div>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CategoryField<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: FieldPath<T>;
}) {
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = Array.isArray(field.value) ? field.value : [];
        const byId = new Map((categories.data ?? []).map((c) => [c.id, c]));
        const toggle = (id: string) =>
          field.onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
        return (
          <FormItem>
            <FormLabel>Categories</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-muted-foreground">
                      {value.length ? `${value.length} selected` : 'Choose categories'}
                    </span>
                    <ChevronsUpDown className="opacity-60" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search categories…" />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    {(['drones', 'accessories', 'equipment', 'industry'] as const).map((group) => (
                      <CommandGroup
                        key={group}
                        heading={
                          {
                            drones: 'Drone types',
                            accessories: 'Accessories and parts',
                            equipment: 'Equipment',
                            industry: 'Industries',
                          }[group]
                        }
                      >
                        {(categories.data ?? [])
                          .filter((c) => c.group === group)
                          .map((c) => (
                            <CommandItem key={c.id} value={c.name} onSelect={() => toggle(c.id)}>
                              <Check
                                className={value.includes(c.id) ? 'opacity-100' : 'opacity-0'}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {value.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {value.map((id) => (
                  <li key={id}>
                    <Badge variant="secondary" className="gap-1">
                      {byId.get(id)?.name ?? id}
                      <button
                        type="button"
                        aria-label={`Remove ${byId.get(id)?.name ?? id}`}
                        onClick={() => toggle(id)}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export function TagsField<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: FieldPath<T>;
}) {
  const [draft, setDraft] = useState('');
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const tags: string[] = Array.isArray(field.value) ? field.value : [];
        const add = () => {
          const t = draft.trim().toLowerCase();
          if (t && !tags.includes(t)) field.onChange([...tags, t]);
          setDraft('');
        };
        return (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    add();
                  }
                }}
                onBlur={add}
                placeholder="Type a tag and press Enter"
              />
            </FormControl>
            {tags.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <li key={t}>
                    <Badge variant="secondary" className="gap-1">
                      {t}
                      <button
                        type="button"
                        aria-label={`Remove tag ${t}`}
                        onClick={() => field.onChange(tags.filter((x) => x !== t))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <FormDescription>Help buyers find this product in search.</FormDescription>
          </FormItem>
        );
      }}
    />
  );
}
