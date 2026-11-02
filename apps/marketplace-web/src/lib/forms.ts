import { getErrorMessage, getFieldErrors } from '@mitdrone/sdk';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

/** Maps an API error onto the form: field errors inline, everything else as a form-level message. */
export function applyApiError<T extends FieldValues>(form: UseFormReturn<T>, error: unknown): void {
  const fields = getFieldErrors(error);
  const known = Object.keys(form.getValues());
  let matched = false;
  for (const [field, message] of Object.entries(fields)) {
    if (known.includes(field)) {
      form.setError(field as Path<T>, { message });
      matched = true;
    }
  }
  if (!matched) form.setError('root', { message: getErrorMessage(error) });
}
