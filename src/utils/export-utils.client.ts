import { downloadCSV } from '@/utils/csv-utils.client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Export data to a file
 * @param data Array of data objects
 * @param columns Array of column definitions or column IDs
 * @param options Export options
 */
export function exportData<T>(
  data: T[],
  columns: (string | { id: string; header: string })[],
  options: {
    format: 'csv';
    filename: string;
  }
): void {
  const { format, filename } = options;

  if (format === 'csv') {
    downloadCSV(data, columns, filename);
  }
}

/**
 * Hook for exporting table data
 */
export function useExportTableData() {
  return useMutation({
    mutationFn: async (params: {
      data: {
        table: string;
        filterBy?: { field: string; value: any };
        filters?: Record<string, any>;
        search?: string;
        searchFields?: string[];
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
        fields: string[];
        format: 'csv';
      };
    }) => {
      // This is a client-side stub that will call the server function
      // Import the server function dynamically to avoid SSR issues
      const { exportTableData } = await import('./export-utils');
      return exportTableData(params);
    },
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
