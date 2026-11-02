'use client';

import { useRecordExport } from '@mitdrone/sdk';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from '@mitdrone/ui';
import { downloadCsv, exportTablePdf } from '@mitdrone/utils';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Exports the current view as CSV or PDF. Every export is recorded in the audit log, because
 * exporting customer and financial data is itself a sensitive action.
 */
export function ExportMenu({
  entity,
  title,
  fetchData,
}: {
  entity: string;
  title: string;
  fetchData: () => Promise<ExportData>;
}) {
  const record = useRecordExport();
  const [busy, setBusy] = useState(false);

  async function run(format: 'csv' | 'pdf') {
    setBusy(true);
    try {
      const { headers, rows } = await fetchData();
      const filename = `${entity}-${new Date().toISOString().slice(0, 10)}`;
      if (format === 'csv')
        downloadCsv(
          filename,
          rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]]))),
          headers,
        );
      else await exportTablePdf({ title, filename, columns: headers, rows });
      await record.mutateAsync({ entity, format, rowCount: rows.length });
      toast.success(
        `Exported ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} as ${format.toUpperCase()}`,
      );
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" loading={busy}>
          <Download /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void run('csv')}>
          <FileSpreadsheet /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run('pdf')}>
          <FileText /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
