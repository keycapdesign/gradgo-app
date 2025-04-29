import { useState } from 'react';
import { exportData, useExportTableData } from '@/utils/export-utils.client';
import { ColumnDef } from '@tanstack/react-table';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ExportButtonProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[] | string[];
  filename?: string;
  // For server-side export
  serverExport?: boolean;
  tableName?: string;
  filterBy?: { field: string; value: string | number | boolean | null };
  fields?: string[];
  // Advanced filtering options for server export
  filters?: Record<string, string | number | boolean | null>;
  search?: string;
  searchFields?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  // Column visibility
  columnVisibility?: Record<string, boolean>;
  // UI customization
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
}

export function ExportButton<TData>({
  data,
  columns,
  filename = 'export',
  serverExport = false,
  tableName,
  filterBy,
  fields,
  filters,
  search,
  searchFields,
  sortBy,
  sortDirection,
  columnVisibility = {},
  variant = 'outline',
  size = 'sm',
  label = 'Export',
}: ExportButtonProps<TData>) {
  const [isExporting, setIsExporting] = useState(false);
  const exportMutation = useExportTableData();

  // Extract column IDs from column definitions, respecting column visibility
  const getColumnIds = () => {
    // For server-side exports, we use the provided fields
    if (serverExport && fields && fields.length > 0) {
      // If columnVisibility is provided, filter fields
      if (Object.keys(columnVisibility).length > 0) {
        return fields.filter((field) => columnVisibility[field] !== false);
      }
      return fields;
    }

    // For client-side exports with string columns
    if (typeof columns[0] === 'string') {
      const stringColumns = columns as string[];
      // If columnVisibility is provided, filter columns
      if (Object.keys(columnVisibility).length > 0) {
        return stringColumns.filter((colId) => columnVisibility[colId] !== false);
      }
      return stringColumns;
    }

    // For client-side exports with column definitions, extract IDs and filter by visibility
    return (columns as ColumnDef<TData, unknown>[])
      .filter((col) => {
        const colId = col.id || '';
        // Include column if visibility is not explicitly set to false
        return columnVisibility[colId] !== false;
      })
      .map((col) => {
        // Get the column ID or accessor
        const accessorKey = (col as { accessorKey?: string }).accessorKey;
        if (typeof accessorKey === 'string') {
          return accessorKey;
        }
        // Fall back to column ID
        return col.id || '';
      })
      .filter(Boolean);
  };

  // Handle client-side export
  const handleClientExport = async () => {
    try {
      setIsExporting(true);

      // Get column IDs
      const columnIds = getColumnIds();

      // Export data
      exportData(data, columnIds, {
        format: 'csv',
        filename: `${filename}-${new Date().toISOString().slice(0, 10)}`,
      });

      toast.success('CSV export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Handle server-side export
  const handleServerExport = async () => {
    if (!tableName || !fields) {
      toast.error('Table name and fields are required for server export');
      return;
    }

    console.log('Exporting data with params:', {
      table: tableName,
      filterBy,
      fields,
      format: 'csv',
      filters,
      search,
      searchFields,
      sortBy,
      sortDirection,
    });

    try {
      // Get visible fields based on column visibility
      const visibleFields = getColumnIds();

      // Pass the data object to the server function
      await exportMutation.mutateAsync({
        data: {
          table: tableName,
          filterBy,
          fields: visibleFields,
          format: 'csv',
          // Include advanced filtering options
          filters,
          search,
          searchFields,
          sortBy,
          sortDirection,
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Handle export based on mode
  const handleExport = () => {
    if (serverExport) {
      handleServerExport();
    } else {
      handleClientExport();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isExporting || exportMutation.isPending}
      onClick={handleExport}
    >
      {isExporting || exportMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
}
