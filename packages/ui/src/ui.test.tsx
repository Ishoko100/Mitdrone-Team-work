import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './components/button';
import { ConfirmDialog } from './components/confirm-dialog';
import { DataTable } from './components/data-table';
import { getPageRange } from './components/pagination';

import type { ColumnDef } from '@tanstack/react-table';

interface Row {
  name: string;
}
const columns: ColumnDef<Row, string>[] = [{ accessorKey: 'name', header: 'Name' }];

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('DataTable', () => {
  it('renders rows and filters with search', async () => {
    render(<DataTable columns={columns} data={[{ name: 'Mavic 3' }, { name: 'Autel EVO' }]} />);
    expect(screen.getByText('Mavic 3')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search…'), 'autel');
    expect(screen.queryByText('Mavic 3')).not.toBeInTheDocument();
    expect(screen.getByText('Autel EVO')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('supports bulk selection', async () => {
    render(
      <DataTable
        columns={columns}
        data={[{ name: 'A' }, { name: 'B' }]}
        enableSelection
        bulkActions={(rows) => <span>{rows.length} to archive</span>}
      />,
    );
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]!);
    expect(screen.getByText('1 to archive')).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('calls onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Delete?"
        description="Gone forever"
        confirmLabel="Delete"
        destructive
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('getPageRange', () => {
  it('collapses long ranges', () => {
    expect(getPageRange(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(getPageRange(1, 1)).toEqual([1]);
  });
});
