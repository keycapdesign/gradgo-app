import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseCSV } from '@/utils/csv-utils.client';

interface FileWithPreview extends File {
  preview?: string;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
}

interface UseCSVParserOptions {
  maxFileSize?: number;
  onParsed?: (data: ParsedData) => void;
}

export function useCSVParser(options: UseCSVParserOptions = {}) {
  const { maxFileSize = 5 * 1024 * 1024, onParsed } = options;

  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        // Parse CSV using d3-dsv
        const result = await parseCSV(file);

        // Transform to the expected format
        const parsedResult: ParsedData = {
          headers: result.headers,
          rows: result.data.map(item => {
            // Convert all values to strings for consistency
            const row: Record<string, string> = {};
            result.headers.forEach(header => {
              const value = item[header];
              row[header] = value === null || value === undefined ? '' : String(value);
            });
            return row;
          }),
          fileName: file.name,
        };

        setParsedData(parsedResult);
        if (onParsed) onParsed(parsedResult);

        return parsedResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse file';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onParsed]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Create preview
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      setFile(fileWithPreview);
      await parseFile(file);
    },
    [parseFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const reset = useCallback(() => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    setParsedData(null);
    setError(null);
  }, [file]);

  return {
    file,
    parsedData,
    isLoading,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    reset,
  };
}
