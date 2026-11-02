import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

function toDate(value: string | Date): Date | null {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDate(value: string | Date, pattern = 'd MMM yyyy'): string {
  const date = toDate(value);
  return date ? format(date, pattern) : '';
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, 'd MMM yyyy, h:mm a');
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : '';
}
