import { unparse } from 'papaparse';

type Cell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, Cell>;

/** Prevents spreadsheet formula injection by prefixing risky cells with a quote. */
function sanitizeCell(value: Cell): Cell {
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

export function toCsv(rows: readonly CsvRow[], columns?: readonly string[]): string {
  const keys = columns ?? Object.keys(rows[0] ?? {});
  const data = rows.map((row) => keys.map((key) => sanitizeCell(row[key])));
  return unparse({ fields: [...keys], data });
}

/** Browser only. */
export function downloadCsv(
  filename: string,
  rows: readonly CsvRow[],
  columns?: readonly string[],
): void {
  const blob = new Blob([toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
