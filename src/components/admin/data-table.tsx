import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ExportButton } from './export-button';
import { FilterConfig, TableFilters } from './table-filters';
import { useDebounce } from '@/hooks/use-debounce';

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

interface DataTableProps<TData, TValue, TExportFilter = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  searchValue: string;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: TData) => void;
  getRowHref?: (row: TData) => string | null;
  // Filter props
  filters?: FilterConfig[];
  activeFilters?: Record<string, string | null>;
  onFilterChange?: (filterId: string, value: string | null) => void;
  filterComponent?: ReactNode;
  // Export props
  enableExport?: boolean;
  exportFilename?: string;
  exportTableName?: string;
  exportFields?: string[];
  exportFilterBy?: { field: string; value: TExportFilter };
}

export function DataTable<TData, TValue, TExportFilter = unknown>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSortChange,
  onPageSizeChange,
  onSearchChange,
  searchValue,
  defaultSortBy = 'created_at',
  defaultSortDirection = 'desc',
  onRowClick,
  getRowHref,
  // Filter props
  filters,
  activeFilters,
  onFilterChange,
  filterComponent,
  // Export props
  enableExport = false,
  exportFilename,
  exportTableName,
  exportFields,
  exportFilterBy,
}: DataTableProps<TData, TValue, TExportFilter>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState(searchValue);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const debouncedSearch = useDebounce(searchInput, 300);

  // Get navigate function at the component level
  const navigate = useNavigate();

  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchValue]);

  useEffect(() => {
    // Reset sorting when page changes
    setSorting([]);
  }, [page]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pageSize),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
      sorting,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      console.log('New sorting state:', newSorting);
      setSorting(newSorting);
      if (newSorting.length > 0) {
        const { id, desc } = newSorting[0];
        console.log('Sorting by:', id, desc ? 'desc' : 'asc');
        onSortChange(id, desc ? 'desc' : 'asc');
      } else {
        console.log('No sorting, using default');
        onSortChange(defaultSortBy, defaultSortDirection);
      }
    },
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
            value={searchInput.trim()}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[250px]"
          />

          {/* Custom filter component */}
          {filterComponent}

          {/* Default filters if provided */}
          {!filterComponent && filters && activeFilters && onFilterChange && (
            <TableFilters
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              onClearFilters={() => {
                // Clear all filters
                if (onFilterChange) {
                  filters.forEach((filter) => {
                    onFilterChange(filter.id, null);
                  });
                }
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {enableExport && (
            <ExportButton
              data={data}
              columns={columns}
              filename={exportFilename || 'export'}
              serverExport={!!(exportTableName && exportFields)}
              tableName={exportTableName}
              filterBy={exportFilterBy}
              fields={exportFields}
              // Pass current search and filter state
              search={searchValue}
              searchFields={exportFields}
              sortBy={sorting.length > 0 ? sorting[0].id : defaultSortBy}
              sortDirection={
                sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : defaultSortDirection
              }
              filters={activeFilters}
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
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
