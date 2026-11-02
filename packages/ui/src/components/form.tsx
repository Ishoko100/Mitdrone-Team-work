'use client';

import { Slot } from '@radix-ui/react-slot';
import { createContext, useContext, useId, type ComponentProps } from 'react';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { cn } from '../lib/cn';

import { Label } from './label';

export const Form = FormProvider;

const FieldContext = createContext<{ name: string } | null>(null);
const ItemContext = createContext<{ id: string } | null>(null);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FieldContext.Provider>
  );
}

function useFormField() {
  const field = useContext(FieldContext);
  const item = useContext(ItemContext);
  const { getFieldState, formState } = useFormContext();
  if (!field || !item)
    throw new Error('Form components must be used inside <FormField> and <FormItem>');
  const state = getFieldState(field.name, formState);
  return {
    name: field.name,
    error: state.error,
    id: item.id,
    controlId: `${item.id}-control`,
    descriptionId: `${item.id}-description`,
    messageId: `${item.id}-message`,
  };
}

export function FormItem({ className, ...props }: ComponentProps<'div'>) {
  const id = useId();
  return (
    <ItemContext.Provider value={{ id }}>
      <div className={cn('space-y-2', className)} {...props} />
    </ItemContext.Provider>
  );
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { error, controlId } = useFormField();
  return (
    <Label htmlFor={controlId} className={cn(error && 'text-destructive', className)} {...props} />
  );
}

export function FormControl(props: ComponentProps<typeof Slot>) {
  const { error, controlId, descriptionId, messageId } = useFormField();
  return (
    <Slot
      id={controlId}
      aria-describedby={error ? `${descriptionId} ${messageId}` : descriptionId}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}

export function FormDescription({ className, ...props }: ComponentProps<'p'>) {
  const { descriptionId } = useFormField();
  return (
    <p id={descriptionId} className={cn('text-muted-foreground text-sm', className)} {...props} />
  );
}

export function FormMessage({ className, children, ...props }: ComponentProps<'p'>) {
  const { error, messageId } = useFormField();
  const body = error ? String(error.message ?? '') : children;
  if (!body) return null;
  return (
    <p
      id={messageId}
      role="alert"
      className={cn('text-destructive text-sm font-medium', className)}
      {...props}
    >
      {body}
    </p>
  );
}
