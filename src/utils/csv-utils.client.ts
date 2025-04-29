/**
 * Client-side CSV utilities using d3-dsv
 * This is a replacement for PapaParse to avoid SSR issues
 */

import { csvParse, csvFormat } from 'd3-dsv';

/**
 * Parse a CSV file
 * @param file The file to parse
 * @returns Promise that resolves to the parsed data
 */
export function parseCSV<T = Record<string, any>>(
  file: File
): Promise<{ data: T[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvString = event.target?.result as string;
        const parsedData = csvParse(csvString);
        
        // Extract headers from the columns
        const headers = parsedData.columns || [];
        
        // Convert to the expected format
        resolve({
          data: parsedData as unknown as T[],
          headers
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
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

  // Create a new array with the data formatted for d3-dsv
  const formattedData = data.map((item) => {
    const row: Record<string, any> = {};
    columnDefs.forEach((col) => {
      const value = getNestedValue(item, col.id);
      row[col.header] = value;
    });
    return row;
  });

  // Convert to CSV
  return csvFormat(formattedData);
}

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
 * Get a nested value from an object using a dot-notation path
 * @param obj The object to get the value from
 * @param path The path to the value (e.g. 'user.name')
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  
  return value;
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
  
  // Create a download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

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
