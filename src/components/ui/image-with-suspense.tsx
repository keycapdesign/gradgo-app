import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithSuspenseProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

export function ImageWithSuspense({
  src,
  alt,
  className,
  fallbackClassName,
  ...props
}: ImageWithSuspenseProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton 
          className={cn(
            "absolute inset-0 z-10",
            fallbackClassName || className
          )} 
        />
      )}
      {!hasError ? (
        <img
          src={src}
          alt={alt || ""}
          className={cn(className, isLoading && "opacity-0")}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      ) : (
        <div className={cn(
          "flex items-center justify-center bg-muted rounded-md",
          className
        )}>
          <span className="text-sm text-muted-foreground">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
