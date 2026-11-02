import type { ApiErrorBody } from '@mitdrone/types';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(
    body: Pick<ApiErrorBody, 'status' | 'code' | 'message'> & {
      fieldErrors?: Record<string, string[]> | undefined;
    },
  ) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = body.status;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors;
  }
}

export const isApiError = (error: unknown): error is ApiClientError =>
  error instanceof ApiClientError;

/** Safe, user-facing message for toasts and error states. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (isApiError(error))
    return error.status === 0
      ? 'Network error. Check your connection and try again.'
      : error.message;
  return fallback;
}

/** First message per field, ready for React Hook Form's setError. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || !error.fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(error.fieldErrors).flatMap(([field, messages]) =>
      messages[0] ? [[field, messages[0]]] : [],
    ),
  );
}
