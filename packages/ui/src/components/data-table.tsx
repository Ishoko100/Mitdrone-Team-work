'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { cn } from '../lib/cn';

import { Button } from './button';
import { Checkbox } from './checkbox';
import { EmptyState } from './empty-state';
import { Input } from './input';
import { Pagination } from './pagination';
import { Skeleton } from './skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

export interface ServerPagination {
  page: number; // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack's ColumnDef is invariant in TValue
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  enableSelection?: boolean;
  /** Rendered in a bar when rows are selected. */
  bulkActions?: (selected: TData[], clear: () => void) => ReactNode;
  /** Extra filters rendered next to the search box. */
  toolbar?: ReactNode;
  pageSize?: number;
  /** Provide for server-side pagination (URL/API driven). Omit for client-side. */
  serverPagination?: ServerPagination;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  if (!column.getCanSort()) return <span>{title}</span>;
  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 px-3 text-xs font-medium uppercase tracking-wide"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      aria-label={`Sort by ${title}`}
    >
      {title}
      <Icon aria-hidden="true" />
    </Button>
  );
}

function selectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
        aria-label="Select all rows on this page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
        onClick={(event) => event.stopPropagation()}
        aria-label="Select row"
      />
    ),
  };
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search…',
  enableSelection = false,
  bulkActions,
  toolbar,
  pageSize = 10,
  serverPagination,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting your search or filters.',
  onRowClick,
  getRowId,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const allColumns = useMemo(
    () => (enableSelection ? [selectColumn<TData>(), ...columns] : columns),
    [enableSelection, columns],
  );

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      pagination: serverPagination
        ? { pageIndex: serverPagination.page - 1, pageSize: serverPagination.pageSize }
        : pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: serverPagination ? undefined : setPagination,
    manualPagination: Boolean(serverPagination),
    pageCount: serverPagination
      ? Math.max(1, Math.ceil(serverPagination.total / serverPagination.pageSize))
      : undefined,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: serverPagination ? undefined : getPaginationRowModel(),
  });

  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const rows = table.getRowModel().rows;
  const colCount = table.getVisibleLeafColumns().length;
  const page = serverPagination ? serverPagination.page : pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <div className={cn('space-y-4', className)}>
      {searchable || toolbar ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-9"
              />
            </div>
          ) : null}
          {toolbar}
        </div>
      ) : null}

      {enableSelection && bulkActions && selected.length > 0 ? (
        <div
          role="status"
          className="bg-accent flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2 text-sm"
        >
          <span className="font-medium">{selected.length} selected</span>
          {bulkActions(selected, () => table.resetRowSelection())}
        </div>
      ) : null}

      <div className="bg-card shadow-soft rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: colCount }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[160px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colCount} className="p-6">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(next) =>
          serverPagination ? serverPagination.onPageChange(next) : table.setPageIndex(next - 1)
        }
      />
    </div>
  );
}
