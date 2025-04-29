import { createClient as createServerClient } from '@/utils/supabase/server';
import { useMutation } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { csvFormat } from 'd3-dsv';
import FileSaver from 'file-saver';
import { toast } from 'sonner';

/**
 * Format column name for display
 * @param id Column ID
 * @returns Formatted column name
 */
export function formatColumnName(id: string): string {
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert data to CSV format
 * @param data Array of data objects
 * @param columns Array of column definitions or column IDs
 * @returns CSV string
 */
export function convertToCSV<T>(
  data: T[],
  columns: (string | { id: string; header: string })[]
): string {
  // Extract column IDs and headers
  const columnDefs = columns.map((col: string | { id: string; header: string }) => {
    if (typeof col === 'string') {
      return { id: col, header: formatColumnName(col) };
    }
    return col;
  });

  // Headers are automatically extracted by d3-dsv

  // Create data rows
  const rows = data.map((item) => {
    const row: Record<string, any> = {};
    columnDefs.forEach((col) => {
      const value = getNestedValue(item, col.id);
      row[col.header] = value;
    });
    return row;
  });

  // Convert to CSV using d3-dsv
  return csvFormat(rows);
}

/**
 * Download data as CSV
 * @param data Array of data objects
 * @param columns Array of column definitions or column IDs
 * @param filename Filename for the downloaded file
 */
export function downloadCSV<T>(
  data: T[],
  columns: (string | { id: string; header: string })[],
  filename: string
): void {
  const csv = convertToCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  FileSaver.saveAs(blob, `${filename}.csv`);
}

/**
 * Get nested value from an object using dot notation
 * @param obj Object to get value from
 * @param path Path to value using dot notation
 * @returns Value at path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Export data directly from the client
 * @param data Data to export
 * @param columns Columns to include in the export
 * @param options Export options
 */
export function exportData<T>(
  data: T[],
  columns: (string | { id: string; header: string })[],
  options: {
    format: 'csv';
    filename: string;
  }
) {
  const { filename } = options;
  downloadCSV(data, columns, filename);
}

/**
 * Server function to export data from a table
 */
export const exportTableData = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      table: string;
      filterBy?: { field: string; value: any };
      filters?: Record<string, any>;
      search?: string;
      searchFields?: string[];
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      fields: string[];
      format: 'csv';
    }) => {
      // Validate required fields
      if (!data || !data.table) {
        throw new Error('Table name is required for export');
      }

      if (!data.fields || !Array.isArray(data.fields) || data.fields.length === 0) {
        throw new Error('Fields array is required for export');
      }

      return {
        table: data.table,
        filterBy: data.filterBy,
        filters: data.filters || {},
        search: data.search || '',
        searchFields: data.searchFields || [],
        sortBy: data.sortBy,
        sortDirection: data.sortDirection || 'desc',
        fields: data.fields,
        format: data.format || 'csv',
      };
    }
  )
  .handler(
    async (ctx: {
      data: {
        table: string;
        filterBy?: { field: string; value: any };
        filters: Record<string, any>;
        search: string;
        searchFields: string[];
        sortBy?: string;
        sortDirection: 'asc' | 'desc';
        fields: string[];
        format: 'csv';
      };
    }) => {
      const {
        table,
        filterBy,
        filters,
        search,
        searchFields,
        sortBy,
        sortDirection,
        fields,
        format,
      } = ctx.data;

      console.log('Export data request:', {
        table,
        filterBy,
        filters,
        search,
        searchFields,
        sortBy,
        sortDirection,
        fields,
        format,
      });

      const supabase = createServerClient();

      let query = supabase.from(table).select(fields.join(','));

      // Apply single filter if provided
      if (filterBy) {
        query = query.eq(filterBy.field, filterBy.value);
      }

      // Apply multiple filters if provided
      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply search if provided
      if (search && search.trim() !== '') {
        if (table === 'contacts_with_recent_booking') {
          // Special handling for contacts table
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        } else if (searchFields && searchFields.length > 0) {
          // Create OR conditions for each search field
          const searchConditions = searchFields.map((field: string) => {
            return `${field}.ilike.%${search}%`;
          });

          query = query.or(searchConditions.join(','));
        } else {
          // Default search on all fields
          console.log('No search fields provided, search may not work as expected');
        }
      }

      // Apply sorting if provided
      if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
      }

      try {
        // Fetch all data (no pagination)
        const { data, error } = await query;

        if (error) {
          console.error('Supabase query error:', error);
          throw new Error(`Error fetching data: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.log('No data found for export');
        } else {
          console.log(`Found ${data.length} records for export`);
        }

        return {
          data: data as any[],
          format,
          filename: `${table}-export-${new Date().toISOString().slice(0, 10)}`,
        };
      } catch (err) {
        console.error('Export error:', err);
        throw err;
      }
    }
  );

/**
 * Hook for exporting table data
 */
export function useExportTableData() {
  return useMutation({
    mutationFn: exportTableData,
    onSuccess: (result: { data: any[]; format: 'csv'; filename: string }) => {
      const { data, filename } = result;

      if (!data || data.length === 0) {
        toast.warning('No data to export');
        return;
      }

      try {
        downloadCSV(data, data.length > 0 ? Object.keys(data[0]) : [], filename);
        toast.success(`CSV export successful with ${data.length} records`);
      } catch (error) {
        console.error('Error during file download:', error);
        toast.error('Error creating export file');
      }
    },
    onError: (error: any) => {
      console.error('Export mutation error:', error);
      toast.error(`Export failed: ${error?.message || 'Unknown error'}`);
    },
  });
}
