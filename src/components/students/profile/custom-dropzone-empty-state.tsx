import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropzoneContext } from '@/components/dropzone';
import { formatBytes } from '@/components/dropzone';

interface CustomDropzoneEmptyStateProps {
  className?: string;
}

export const CustomDropzoneEmptyState = ({ className }: CustomDropzoneEmptyStateProps) => {
  const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-y-2', className)}>
      <Upload size={20} className="text-muted-foreground" />
      <p className="text-sm">Select a profile picture</p>
      <div className="flex flex-col items-center gap-y-1">
        <p className="text-xs text-muted-foreground">
          Drag and drop or{' '}
          <a
            onClick={() => inputRef.current?.click()}
            className="underline cursor-pointer transition hover:text-foreground"
          >
            browse
          </a>{' '}
          to select
        </p>
        {maxFileSize !== Number.POSITIVE_INFINITY && (
          <p className="text-xs text-muted-foreground">
            Maximum file size: {formatBytes(maxFileSize, 2)}
          </p>
        )}
      </div>
    </div>
  );
};
