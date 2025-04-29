import { useCallback, useEffect } from 'react';
import { File, X } from 'lucide-react';

import { formatBytes, useDropzoneContext } from '@/components/dropzone';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomDropzoneContentProps {
  className?: string;
  onFileSelected: () => void;
}

export const CustomDropzoneContent = ({
  className,
  onFileSelected,
}: CustomDropzoneContentProps) => {
  const { files, setFiles, loading, successes, errors, maxFileSize, maxFiles, isSuccess } =
    useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setFiles(files.filter((file) => file.name !== fileName));
    },
    [files, setFiles]
  );

  // Auto-trigger the onFileSelected callback when a file is added
  useEffect(() => {
    if (files.length > 0 && !exceedMaxFiles && !files.some((file) => file.errors.length !== 0)) {
      // Small delay to allow the file preview to be generated
      const timer = setTimeout(() => {
        onFileSelected();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [files, exceedMaxFiles, onFileSelected]);

  if (isSuccess) {
    return (
      <div className={cn('flex flex-row items-center gap-x-2 justify-center', className)}>
        <p className="text-primary text-sm">Profile picture ready to be adjusted</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {files.map((file, idx) => {
        const fileError = errors.find((e) => e.name === file.name);
        const isSuccessfullyUploaded = !!successes.find((e) => e === file.name);

        return (
          <div
            key={`${file.name}-${idx}`}
            className="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4"
          >
            {file.type.startsWith('image/') ? (
              <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                <img src={file.preview} alt={file.name} className="object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                <File size={18} />
              </div>
            )}

            <div className="shrink grow flex flex-col items-start truncate">
              <p title={file.name} className="text-sm truncate max-w-full">
                {file.name}
              </p>
              {file.errors.length > 0 ? (
                <p className="text-xs text-destructive">
                  {file.errors
                    .map((e) =>
                      e.message.startsWith('File is larger than')
                        ? `File is larger than ${formatBytes(maxFileSize, 2)} (Size: ${formatBytes(
                            file.size,
                            2
                          )})`
                        : e.message
                    )
                    .join(', ')}
                </p>
              ) : loading ? (
                <p className="text-xs text-muted-foreground">Processing file...</p>
              ) : fileError ? (
                <p className="text-xs text-destructive">Error: {fileError.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatBytes(file.size, 2)}</p>
              )}
            </div>

            {!loading && (
              <Button
                size="icon"
                variant="link"
                className="shrink-0 justify-self-end text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveFile(file.name)}
              >
                <X />
              </Button>
            )}
          </div>
        );
      })}
      {exceedMaxFiles && (
        <p className="text-sm text-left mt-2 text-destructive">
          You may upload only up to {maxFiles} file
          {maxFiles > 1 ? 's' : ''}, please remove {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? 's' : ''}.
        </p>
      )}
    </div>
  );
};
