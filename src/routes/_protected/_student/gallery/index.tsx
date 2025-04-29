import { useEffect, useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { createSquareCheckoutLink } from '@/utils/square/checkout';
import {
  downloadMultiplePurchasedImages,
  downloadPurchasedImage,
  studentGalleryImagesQueryOptions,
} from '@/utils/gallery';
import { trackGalleryViewEvent } from '@/utils/event-tracking';

import { CheckoutStatus, CheckoutStatusScreen } from '@/components/gallery/checkout-status';
import { GalleryFallback } from '@/components/gallery/gallery-fallback';
import { GalleryHeader } from '@/components/gallery/gallery-header';
// Import custom components
// Import and extend the Photo interface to include isPurchased
import { Photo as BasePhoto, PhotoGallery } from '@/components/gallery/photo-gallery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Extend the Photo interface to include isPurchased
interface StudentPhoto extends BasePhoto {
  isPurchased?: boolean;
}

export const Route = createFileRoute('/_protected/_student/gallery/')({
  component: StudentGalleryView,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw new Error('You must be logged in to view your gallery');
    }

    return {
      title: 'My Gallery',
    };
  },
  errorComponent: ({ error }) => {
    console.error('[StudentGalleryRoute] Error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error.message}</p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="h-12 px-6 text-lg"
              >
                Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
});

function StudentGalleryView() {
  const navigate = useNavigate();

  // State for UI control
  const [selectedPhotos, setSelectedPhotos] = useState<StudentPhoto[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null);

  // Function to completely reset the form state
  const resetToInitialState = () => {
    console.log('Resetting to initial state - clearing all state variables');
    setSelectedPhotos([]);
    setCheckoutStatus(null);
  };

  // Fetch contact data using suspense query
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());

  // Only proceed with fetching images if we have a contact ID
  const contactId = contactData?.contact_id || 0;

  // Fetch images using the contact ID - we'll handle the case where contactId is 0 in the UI
  const {
    data: galleryData,
    isLoading,
    error,
    isFetching,
  } = useSuspenseQuery(studentGalleryImagesQueryOptions(contactId));

  // Track gallery view when the component mounts
  useEffect(() => {
    if (contactId > 0 && galleryData?.event?.id) {
      trackGalleryViewEvent(contactId, galleryData.event.id).catch((error) => {
        console.error('Error tracking gallery view:', error);
      });
    }
  }, [contactId, galleryData]);

  // Handle photo selection changes
  const handleSelectionChange = (photos: BasePhoto[]) => {
    setSelectedPhotos(photos as StudentPhoto[]);
  };

  // Download a single purchased image
  const downloadSingleImageMutation = useMutation({
    mutationFn: downloadPurchasedImage,
    onSuccess: async (data) => {
      try {
        // Fetch the image data
        const response = await fetch(data.url);
        if (!response.ok) throw new Error(`Failed to fetch image`);

        // Get the image as a blob
        const blob = await response.blob();

        // Use saveAs to download the file directly without opening a browser window
        FileSaver.saveAs(blob, data.filename);

        toast.success('Image download started');
      } catch (error) {
        console.error('Error downloading image:', error);
        toast.error('Failed to download image. Please try again.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download image');
    },
  });

  // Handle download button click for a single image
  const handleSingleImageDownload = (imageId: string) => {
    downloadSingleImageMutation.mutate({
      data: {
        imageId,
        contactId,
      },
    });
  };

  // Download multiple purchased images
  const downloadMultipleImagesMutation = useMutation({
    mutationFn: downloadMultiplePurchasedImages,
    onSuccess: async (data) => {
      try {
        // Create a new zip file
        const zip = new JSZip();

        // Add each image to the zip file
        const fetchPromises = data.images.map(async (image: any) => {
          try {
            // Fetch the image data
            const response = await fetch(image.url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${image.filename}`);

            const blob = await response.blob();
            // Add the image to the zip file
            zip.file(image.filename, blob);
            return true;
          } catch (error) {
            console.error(`Error processing image ${image.filename}:`, error);
            return false;
          }
        });

        // Wait for all images to be processed
        await Promise.all(fetchPromises);

        // Generate the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Save the zip file
        FileSaver.saveAs(zipBlob, `gradgo-photos-${new Date().toISOString().slice(0, 10)}.zip`);

        toast.success(`Your photos are being downloaded as a zip file`);
      } catch (error) {
        console.error('Error creating zip file:', error);
        toast.error('Failed to create zip file. Please try again.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download images');
    },
  });

  // Handle download button click for multiple images
  const handleDownloadSelectedImages = () => {
    const purchasedSelectedPhotos = selectedPhotos.filter((photo) => photo.isPurchased);

    if (purchasedSelectedPhotos.length === 0) {
      toast.error('No purchased photos selected for download');
      return;
    }

    downloadMultipleImagesMutation.mutate({
      data: {
        imageIds: purchasedSelectedPhotos.map((photo) => photo.id),
        contactId,
      },
    });
  };

  // Create checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: createSquareCheckoutLink,
    onSuccess: (data) => {
      console.log('Checkout link created:', data);
      // Redirect to Square checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to create checkout link');
        setCheckoutStatus(null);
      }
    },
    onError: (error) => {
      console.error('Error creating checkout link:', error);
      toast.error('Failed to create checkout link');
      setCheckoutStatus(null);
    },
  });

  // Handle checkout button click
  const handleCheckout = () => {
    // Filter out any already purchased photos
    const unpurchasedSelectedPhotos = selectedPhotos.filter((photo) => !photo.isPurchased);

    if (unpurchasedSelectedPhotos.length === 0) {
      toast.error('Please select at least one photo to purchase');
      return;
    }

    // Check if any purchase options are selected
    const hasSelectedOptions = unpurchasedSelectedPhotos.some((photo) => {
      const options = photo.purchaseOptions;
      return options && (options.digitalDownload || options.printCopy);
    });

    if (!hasSelectedOptions) {
      toast.error('Please select purchase options for at least one photo');
      return;
    }

    // Set processing status
    setCheckoutStatus('processing');

    // Get selected images with purchase options (excluding already purchased ones)
    const checkoutImages = unpurchasedSelectedPhotos.map((photo) => ({
      id: photo.id,
      purchaseOptions: photo.purchaseOptions || { digitalDownload: true, printCopy: false },
    }));

    // Create checkout link
    checkoutMutation.mutate({
      data: {
        contactId: contactData?.contact_id || 0,
        images: checkoutImages,
        redirectUrl: window.location.origin + '/checkout/success',
      },
    });
  };

  // Handle purchase options change
  const handlePurchaseOptionsChange = (
    photoId: string,
    options: { digitalDownload: boolean; printCopy: boolean }
  ) => {
    console.log('Purchase options changed:', photoId, options);
    setSelectedPhotos((prev) => {
      return prev.map((photo) => {
        if (photo.id === photoId) {
          return { ...photo, purchaseOptions: options };
        }
        return photo;
      });
    });
  };

  // Show loading state while fetching user data
  if (isLoading || isFetching) {
    return <GalleryFallback />;
  }

  // Show error state if there was an error fetching user data
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error.message}</p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="h-12 px-6 text-lg"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show photo gallery if gallery data is loaded and we have a valid contact ID
  if (contactId > 0 && galleryData && galleryData.images) {
    return (
      <>
        <div className="flex flex-col min-h-screen">
          <GalleryHeader
            title="My Gallery"
            // Only count unpurchased photos for checkout
            selectedCount={selectedPhotos.filter((photo) => !photo.isPurchased).length}
            onCheckoutClick={handleCheckout}
            checkoutButtonText="Proceed to Checkout"
            checkoutButtonIcon="cart"
            showExitButton={false}
            showDownloadButton={true}
            onDownloadClick={handleDownloadSelectedImages}
            downloadButtonDisabled={
              downloadMultipleImagesMutation.isPending || downloadSingleImageMutation.isPending
            }
            purchasedCount={selectedPhotos.filter((photo) => photo.isPurchased).length}
          />

          <div className="flex-1 container mx-auto py-4 px-4">
            {galleryData.images && galleryData.images.length > 0 ? (
              <>
                <PhotoGallery
                  photos={galleryData.images
                    .map((img: any) => ({
                      id: img.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
                      url: img.url || '',
                      isPrintReady: Boolean(img.is_print_ready),
                      originalPath: img.path || '',
                      isPurchased: Boolean(img.digital_download),
                      purchaseOptions: {
                        digitalDownload: true,
                        printCopy: false,
                      },
                    }))
                    .filter((img: any) => img.url)}
                  onSelectionChange={handleSelectionChange}
                  onPurchaseOptionsChange={handlePurchaseOptionsChange}
                  onDownloadClick={handleSingleImageDownload}
                  showPurchaseOptions={true}
                  isPrintingAvailable={galleryData.event?.is_printing_available ?? false}
                  isLoading={checkoutStatus !== null}
                  isDownloading={
                    downloadMultipleImagesMutation.isPending ||
                    downloadSingleImageMutation.isPending
                  }
                />

                {/* Add custom overlay for purchased images */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Your Gallery</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Purchased images</span> are shown in full
                    resolution without watermarks and have a
                    <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      download
                    </span>
                    icon. These images won't be added to your cart when checking out.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    <span className="font-medium">Individual download:</span> Click directly on the
                    download icon of any purchased image.
                    <br />
                    <span className="font-medium">Bulk download:</span> Select multiple purchased
                    images and click the "Download" button in the header.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Alert className="max-w-md">
                  <Info className="h-4 w-4" />
                  <AlertDescription>No photos found for your account.</AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Default view - show a message based on what's missing
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Gallery Not Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {contactId === 0 ? (
            <p>
              We couldn't find your contact information. Please complete your profile setup first.
            </p>
          ) : (
            <p>We couldn't find any photos in your gallery.</p>
          )}
          <div className="mt-4">
            <Button onClick={() => navigate({ to: '/' })} size="lg" className="h-12 px-6 text-lg">
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
