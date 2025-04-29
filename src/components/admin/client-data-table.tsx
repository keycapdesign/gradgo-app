import { MouseEvent, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ExportButton } from './export-button';
import { FilterConfig, TableFilters } from './table-filters';
import { useDebounce } from '@/hooks/use-debounce';
import { EnhancedOperation } from '@/types/offline';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  getRowHref?: (row: TData) => string | null;
  // Filter props
  filters?: FilterConfig[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  pendingOperationsCache?: Record<number, EnhancedOperation[]>;
  // Export props
  enableExport?: boolean;
  exportFilename?: string;
}

export function ClientDataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  getRowHref,
  filters,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  // Export props
  enableExport = false,
  exportFilename = 'export',
}: ClientDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const debouncedGlobalFilter = useDebounce(globalFilter, 300);

  // Get navigate function at the component level
  const navigate = useNavigate();

  // Create active filters object for the TableFilters component
  const activeFilters = useMemo(() => {
    if (!filters) return {};

    const result: Record<string, string | null> = {};
    filters.forEach((filter) => {
      const columnFilter = columnFilters.find((cf) => cf.id === filter.id);
      result[filter.id] = columnFilter ? (columnFilter.value as string) : null;
    });

    return result;
  }, [filters, columnFilters]);

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: string | null) => {
    if (value === null) {
      setColumnFilters((prev) => prev.filter((filter) => filter.id !== filterId));
    } else {
      setColumnFilters((prev) => {
        const existing = prev.find((filter) => filter.id === filterId);
        if (existing) {
          return prev.map((filter) => (filter.id === filterId ? { ...filter, value } : filter));
        } else {
          return [...prev, { id: filterId, value }];
        }
      });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter('');
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      columnVisibility,
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      pagination,
    },
    // Enable fuzzy/contains text filtering for global filter
    globalFilterFn: 'includesString',
  });

  const formatColumnName = (id: string) => {
    return id
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[250px]"
          />

          {/* Default filters if provided */}
          {filters && (
            <TableFilters
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableExport && (
            <ExportButton
              data={data}
              columns={columns}
              filename={exportFilename}
              // For client-side tables, we don't need server export
              // as we already have all the data
              // Pass column visibility state
              columnVisibility={columnVisibility}
              variant="outline"
              size="sm"
            />
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {formatColumnName(column.id)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // Determine if row is clickable
                const isClickable = !!(onRowClick || getRowHref);
                const href = getRowHref ? getRowHref(row.original as TData) : null;

                // Handle row click while preventing clicks on interactive elements
                const handleRowClick = (e: MouseEvent<HTMLTableRowElement>) => {
                  // Don't trigger row click if the click was on an interactive element
                  const target = e.target as HTMLElement;
                  const isInteractiveElement =
                    target.closest('button') ||
                    target.closest('a') ||
                    target.closest('input') ||
                    target.closest('[role="checkbox"]') ||
                    target.closest('[data-interactive="true"]');

                  if (isInteractiveElement) return;

                  if (href) {
                    // Use TanStack Router's navigate function instead of window.location
                    navigate({ to: href });
                  } else if (onRowClick) {
                    onRowClick(row.original as TData);
                  }
                };

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    data-clickable={isClickable ? 'true' : undefined}
                    onClick={isClickable ? handleRowClick : undefined}
                    style={isClickable ? { cursor: 'pointer' } : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
