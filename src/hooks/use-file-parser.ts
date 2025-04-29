import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';

interface FileWithPreview extends File {
  preview?: string;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
}

interface UseFileParserOptions {
  maxFileSize?: number;
  onParsed?: (data: ParsedData) => void;
}

export function useFileParser(options: UseFileParserOptions = {}) {
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
        // Parse CSV
        const result = await new Promise<Papa.ParseResult<Record<string, string>>>(
          (resolve, reject) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: resolve,
              error: reject,
              // Transform empty values to null for consistency
              transform: (value) => (value.trim() === '' ? null : value),
            });
          }
        );

        const parsedResult = {
          headers: result.meta.fields || [],
          rows: result.data,
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
