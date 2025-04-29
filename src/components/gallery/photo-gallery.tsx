import { useState } from 'react';
import { CheckCircle, Download, Info, Loader2, Printer } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PurchaseOptionsFormProps {
  photoId: string;
  initialValues: { digitalDownload: boolean; printCopy: boolean };
  isPrintingAvailable: boolean;
  onSubmit: (photoId: string, options: { digitalDownload: boolean; printCopy: boolean }) => void;
}

function PurchaseOptionsForm({
  photoId,
  initialValues,
  isPrintingAvailable,
  onSubmit,
}: PurchaseOptionsFormProps) {
  const { watch, setValue } = useForm({
    defaultValues: initialValues,
  });

  const digitalDownload = watch('digitalDownload');
  const printCopy = watch('printCopy');

  // Handle changes manually instead of with useEffect
  const handleDigitalDownloadChange = (checked: boolean) => {
    setValue('digitalDownload', checked);
    onSubmit(photoId, { digitalDownload: checked, printCopy });
  };

  const handlePrintCopyChange = (checked: boolean) => {
    setValue('printCopy', checked);
    onSubmit(photoId, { digitalDownload, printCopy: checked });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-2 hover:bg-accent/10 rounded-md">
        <div className="flex items-center space-x-2 cursor-pointer w-full">
          <Checkbox
            id={`digital-${photoId}`}
            checked={digitalDownload}
            onCheckedChange={(checked) => handleDigitalDownloadChange(checked === true)}
          />
          <div>
            <Label htmlFor={`digital-${photoId}`} className="font-medium cursor-pointer">
              Digital Download
            </Label>
            <p className="text-xs text-muted-foreground">High-resolution digital copy</p>
          </div>
        </div>
        <span className="text-sm font-semibold">£20.00</span>
      </div>

      <div
        className={`flex items-center justify-between p-2 ${isPrintingAvailable ? 'hover:bg-accent/10' : ''} rounded-md ${!isPrintingAvailable ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center space-x-2 cursor-pointer w-full">
          <Checkbox
            id={`print-${photoId}`}
            checked={printCopy}
            onCheckedChange={(checked) => handlePrintCopyChange(checked === true)}
            disabled={!isPrintingAvailable}
          />
          <div>
            <Label htmlFor={`print-${photoId}`} className="font-medium cursor-pointer">
              Print Copy
            </Label>
            <p className="text-xs text-muted-foreground">Physical printed photo</p>
          </div>
        </div>
        <span className="text-sm font-semibold">£20.00</span>
      </div>

      {!isPrintingAvailable && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          Print copies are no longer available for this event
        </p>
      )}

      {digitalDownload && printCopy && (
        <div className="mt-3 p-2 bg-primary/10 rounded-md">
          <p className="text-xs font-medium">Bundle Discount Applied!</p>
          <p className="text-xs text-muted-foreground">Digital + Print: £37.50 (Save £2.50)</p>
        </div>
      )}
    </div>
  );
}

export interface Photo {
  id: string;
  url: string;
  selected?: boolean;
  isPrintReady?: boolean;
  isPurchased?: boolean;
  originalPath?: string;
  purchaseOptions?: {
    digitalDownload: boolean;
    printCopy: boolean;
  };
}

interface PhotoGalleryProps {
  photos: Photo[];
  onSelectionChange: (selectedPhotos: Photo[]) => void;
  isLoading?: boolean;
  isDownloading?: boolean;
  onPurchaseOptionsChange?: (
    photoId: string,
    options: { digitalDownload: boolean; printCopy: boolean }
  ) => void;
  onDownloadClick?: (photoId: string) => void;
  showPurchaseOptions?: boolean;
  isPrintingAvailable?: boolean;
}

export function PhotoGallery({
  photos,
  onSelectionChange,
  isLoading = false,
  isDownloading = false,
  onPurchaseOptionsChange,
  onDownloadClick,
  showPurchaseOptions = false,
  isPrintingAvailable = true,
}: PhotoGalleryProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  // No longer need expandedPhotoId state

  const togglePhotoSelection = (photo: Photo) => {
    let newSelectedPhotos: Photo[];

    if (selectedPhotos.some((p) => p.id === photo.id)) {
      // Remove from selection
      newSelectedPhotos = selectedPhotos.filter((p) => p.id !== photo.id);
    } else {
      // Add to selection with digital download checked by default
      const photoWithDefaultOptions = {
        ...photo,
        purchaseOptions: {
          digitalDownload: true,
          printCopy: false,
        },
      };
      newSelectedPhotos = [...selectedPhotos, photoWithDefaultOptions];
    }

    setSelectedPhotos(newSelectedPhotos);
    onSelectionChange(newSelectedPhotos);

    // Only call onPurchaseOptionsChange when adding a non-purchased photo
    if (
      !selectedPhotos.some((p) => p.id === photo.id) &&
      !photo.isPurchased &&
      onPurchaseOptionsChange
    ) {
      onPurchaseOptionsChange(photo.id, { digitalDownload: true, printCopy: false });
    }
  };

  // Purchase options are now shown automatically when a photo is selected

  const handlePurchaseOptionChange = (
    photoId: string,
    options: { digitalDownload: boolean; printCopy: boolean }
  ) => {
    if (!onPurchaseOptionsChange) return;
    onPurchaseOptionsChange(photoId, options);
  };

  const isPhotoSelected = (photoId: string) => {
    return selectedPhotos.some((p) => p.id === photoId);
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 pt-4 pb-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="relative">
            <Skeleton className="w-full h-auto aspect-[3/4] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid md:grid-cols-2 gap-6 pt-4 pb-8">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group cursor-pointer}`}
            onClick={() => togglePhotoSelection(photo)}
          >
            <div className="overflow-hidden rounded-lg">
              <img
                src={photo.url}
                alt="Graduation photo"
                className="w-full h-auto object-cover aspect-[3/4]"
                loading="lazy"
              />
            </div>

            {/* Selection indicator - shown for all images */}
            <div
              className={`absolute top-3 right-3 ${isPhotoSelected(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-20`}
            >
              <Button
                variant={isPhotoSelected(photo.id) ? 'default' : 'secondary'}
                size="icon"
                className={`h-10 w-10 rounded-full shadow-md ${photo.isPurchased ? 'bg-primary/80 hover:bg-primary/90' : ''}`}
              >
                <CheckCircle
                  className={`h-6 w-6 ${isPhotoSelected(photo.id) ? 'text-white' : 'text-muted-foreground'}`}
                />
              </Button>
            </div>

            {/* Purchase options indicator */}
            {showPurchaseOptions &&
              !isPrintingAvailable &&
              isPhotoSelected(photo.id) &&
              !photo.isPurchased && (
                <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs font-medium shadow-md z-20">
                  {photo.purchaseOptions?.digitalDownload && photo.purchaseOptions?.printCopy
                    ? 'Digital + Print: £37.50'
                    : photo.purchaseOptions?.digitalDownload
                      ? 'Digital: £20.00'
                      : photo.purchaseOptions?.printCopy
                        ? 'Print: £20.00'
                        : 'Select Options'}
                </div>
              )}

            {/* Border for selected photos - only for non-purchased images */}
            {!photo.isPurchased && (
              <div
                className={`absolute inset-0 rounded-lg border-4 ${isPhotoSelected(photo.id) ? 'border-primary' : 'border-transparent'} transition-colors`}
              ></div>
            )}

            {/* Special border for purchased images */}
            {photo.isPurchased && (
              <div className="absolute inset-0 rounded-lg border-4 border-primary/30 transition-colors"></div>
            )}

            {/* Print ready indicator */}
            {photo.isPrintReady && (
              <div className="absolute top-3 left-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-white text-accent p-2 rounded-full shadow-md">
                      <Printer className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Ready to print</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Purchased indicator with download functionality */}
            {photo.isPurchased && (
              <div
                className="absolute top-3 left-3 ml-12 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent toggling selection
                  if (!isDownloading && onDownloadClick) {
                    onDownloadClick(photo.id);
                  }
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-md hover:bg-primary/80 transition-colors">
                      {isDownloading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      {isDownloading
                        ? 'Download in progress...'
                        : 'Click to download this purchased image'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Purchase options overlay - shown when photo is selected and not already purchased */}
            {isPhotoSelected(photo.id) && (
              <div
                className={`absolute inset-0 bg-background/40 ${isPrintingAvailable && 'backdrop-blur-sm'} flex flex-col items-center justify-center p-4 rounded-lg z-10`}
                onClick={(e) => {
                  // Allow clicking the overlay to deselect the photo
                  e.stopPropagation();
                  togglePhotoSelection(photo);
                }}
              >
                {isPrintingAvailable && showPurchaseOptions && (
                  <div
                    className="bg-card border rounded-lg shadow-lg p-4 w-full max-w-xs"
                    onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking inside the panel
                  >
                    <h3 className="text-lg font-semibold mb-3 text-center">Purchase Options</h3>

                    <PurchaseOptionsForm
                      photoId={photo.id}
                      initialValues={
                        photo.purchaseOptions || { digitalDownload: true, printCopy: false }
                      }
                      isPrintingAvailable={isPrintingAvailable}
                      onSubmit={handlePurchaseOptionChange}
                    />

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Click outside this panel to deselect this photo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
