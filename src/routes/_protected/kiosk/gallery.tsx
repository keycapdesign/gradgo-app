import { Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Info, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  useTerminalCheckoutMutation,
  useTransactionStatusSubscription,
} from '@/utils/terminal-checkout';
import { useCreatePrintOrders } from '@/utils/print-orders';
import { fetchStudentByGownRfid } from '@/utils/gallery';
import { useEventStore } from '@/stores/event-store';

import { CheckoutStatus, CheckoutStatusScreen } from '@/components/gallery/checkout-status';
import { ExitDialog } from '@/components/gallery/exit-dialog';
import { GalleryFallback, RfidFormFallback } from '@/components/gallery/gallery-fallback';
import { GalleryHeader } from '@/components/gallery/gallery-header';
import { Photo, PhotoGallery } from '@/components/gallery/photo-gallery';
// Import custom components
import { RfidForm, RfidFormValues } from '@/components/gallery/rfid-form';
import { RfidScanHelp } from '@/components/gallery/rfid-scan-help';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_protected/kiosk/gallery')({
  component: GalleryModeWrapper,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' });
    }

    return {
      title: 'Photo Gallery Kiosk',
    };
  },
  loader: () => {
    // We don't load any data by default, but we set up the loader
    // to be used later when an RFID is scanned
    return {
      title: 'Photo Gallery Kiosk',
    };
  },
  errorComponent: ({ error }) => {
    console.error('[GalleryRoute] Error:', error);
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

// Wrapper component that handles suspense
function GalleryModeWrapper() {
  return (
    <Suspense fallback={<RfidFormFallback />}>
      <GalleryMode />
    </Suspense>
  );
}

function GalleryMode() {
  const { selectedEvent } = useEventStore();
  const navigate = useNavigate();

  // State for UI control
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanHelp, setShowScanHelp] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [rfid, setRfid] = useState<string>('');
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  // Get device ID from localStorage or create a new one
  useEffect(() => {
    let storedDeviceId = localStorage.getItem('square_device_id');
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem('square_device_id', storedDeviceId);
    }
    // Ensure we have a valid device ID
    setDeviceId(storedDeviceId || uuidv4());
  }, []);

  // Track the current transaction ID for the realtime subscription
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

  // Track whether we're in the process of loading student data
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);

  // Add a safety timeout to prevent getting stuck in loading state
  useEffect(() => {
    if (isLoadingStudent) {
      const safetyTimer = setTimeout(() => {
        setIsLoadingStudent(false);
      }, 8000); // 8 second maximum loading time
      return () => clearTimeout(safetyTimer);
    }
  }, [isLoadingStudent]);

  // Student data query - only enabled when RFID is provided
  const {
    data: studentData,
    isLoading: isStudentLoading,
    error: studentError,
    isFetching,
  } = useQuery({
    queryKey: ['student', 'rfid', rfid, selectedEvent?.id],
    queryFn: async () => {
      try {
        console.log(`Fetching student data for RFID: ${rfid}`);
        const result = await fetchStudentByGownRfid({ data: { rfid, eventId: selectedEvent?.id } });

        // Validate the result structure
        if (!result || typeof result !== 'object') {
          console.error('Invalid student data result:', result);
          throw new Error('Invalid response format from server');
        }

        // Ensure student data is present
        if (!result.student || !result.student.id) {
          console.error('Missing student data in result:', result);
          throw new Error('Missing student information in response');
        }

        // Ensure images array is present (even if empty)
        if (!Array.isArray(result.images)) {
          console.error('Missing images array in result:', result);
          result.images = [];
        }

        console.log(`Successfully fetched student data with ${result.images.length} images`);
        return result;
      } catch (error) {
        console.error('Error fetching student data:', error);
        setIsLoadingStudent(false);
        throw error;
      }
    },
    enabled: !!rfid,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Update loading state when query status changes
  useEffect(() => {
    if (!isStudentLoading && !isFetching) {
      setIsLoadingStudent(false);
    }
  }, [isStudentLoading, isFetching]);

  // Use the terminal checkout hook
  const terminalCheckout = useTerminalCheckoutMutation();

  // Use the create print orders hook
  const createPrintOrders = useCreatePrintOrders();

  // Function to completely reset the form state
  const resetToInitialState = () => {
    console.log('Resetting to initial state - clearing all state variables');
    // Log current state before reset
    console.log('Current state before reset:', {
      rfid,
      isLoadingStudent,
      isProcessing,
      selectedPhotos: selectedPhotos.length,
      currentTransactionId,
      checkoutStatus,
    });

    // Reset all state variables
    setRfid('');
    setIsLoadingStudent(false);
    setIsProcessing(false);
    setSelectedPhotos([]);
    setCurrentTransactionId(null);
    setCheckoutStatus(null);

    // Log after reset
    console.log('State reset complete - should return to RFID form');
  };

  // Handle transaction status changes
  const handleTransactionStatusChange = (status: string) => {
    console.log(
      `Transaction status changed to: ${status}, current checkout status: ${checkoutStatus}`
    );
    console.log(`Transaction ${currentTransactionId} status changed to: ${status}`);

    if (status === 'COMPLETED' && currentTransactionId && studentData && 'student' in studentData) {
      // Transaction completed, create print orders
      console.log('Transaction completed, setting status to sending_to_print');
      setCheckoutStatus('sending_to_print');
      const imageIds = selectedPhotos.map((photo) => photo.id);

      // Add a small delay to ensure the sending_to_print status is shown for a moment
      setTimeout(() => {
        createPrintOrders.mutate(
          {
            imageIds,
            contactId: studentData.student.id,
            transactionId: currentTransactionId,
          },
          {
            onSuccess: () => {
              console.log('Print orders created successfully, setting status to success');
              setCheckoutStatus('success');
              // Reset the transaction ID
              setCurrentTransactionId(null);
            },
            onError: (error) => {
              toast.error(`Error creating print orders: ${error.message}`);
              setCheckoutStatus(null);
              setCurrentTransactionId(null);
            },
          }
        );
      }, 2000); // 2 second delay to show sending_to_print status
    } else if (status === 'CANCELED') {
      toast.error('Checkout was canceled');
      setCurrentTransactionId(null);
      setCheckoutStatus(null);
    }
  };

  // Subscribe to transaction status changes
  useTransactionStatusSubscription(currentTransactionId, handleTransactionStatusChange);

  // Handle RFID form submission
  const handleRfidSubmit = (values: RfidFormValues) => {
    // Reset state
    setIsProcessing(true);
    setIsLoadingStudent(true);
    setSelectedPhotos([]);

    // Set the RFID which will trigger the query
    setRfid(values.rfid);

    // Set a timeout to ensure we show loading state for at least a short period
    setTimeout(() => {
      if (!isStudentLoading && !isFetching) {
        setIsProcessing(false);
      }
    }, 800); // Slightly longer timeout for better UX

    // Set a maximum timeout to prevent getting stuck in loading state
    setTimeout(() => {
      setIsProcessing(false);
      if (isLoadingStudent) {
        setIsLoadingStudent(false);
      }
    }, 5000); // 5 second maximum loading time
  };

  // Handle photo selection changes
  const handleSelectionChange = (photos: Photo[]) => {
    setSelectedPhotos(photos);
  };

  // Check if all selected photos are print-ready
  const areAllSelectedPhotosReady =
    selectedPhotos.length > 0 && selectedPhotos.every((photo) => photo.isPrintReady);

  // Handle checkout button click
  const handleCheckout = () => {
    console.log('Checkout button clicked, current status:', checkoutStatus);
    if (selectedPhotos.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    if (areAllSelectedPhotosReady && studentData && 'student' in studentData) {
      // If all photos are print-ready, just create print orders directly
      console.log('All photos are print-ready, setting status to sending_to_print');
      setCheckoutStatus('sending_to_print');
      const imageIds = selectedPhotos.map((photo) => photo.id);

      // Add a small delay to ensure the sending_to_print status is shown for a moment
      setTimeout(() => {
        createPrintOrders.mutate(
          {
            imageIds,
            contactId: studentData.student.id,
          },
          {
            onSuccess: () => {
              console.log('Print orders created successfully, setting status to success');
              setCheckoutStatus('success');
              // The auto-dismiss in CheckoutStatusScreen will call resetToInitialState
            },
            onError: (error) => {
              toast.error(`Error creating print orders: ${error.message}`);
              setCheckoutStatus(null);
            },
          }
        );
      }, 2000); // 2 second delay to show sending_to_print status
    } else if (studentData && 'student' in studentData) {
      // Otherwise, initiate Square Terminal checkout
      console.log('Initiating Square Terminal checkout, setting status to processing');
      setCheckoutStatus('processing');

      const imageIds = selectedPhotos.map((photo) => photo.id);

      // Use the terminal checkout mutation
      terminalCheckout.mutate(
        {
          data: {
            imageIds,
            deviceId,
            contactId: studentData.student.id,
            quantity: selectedPhotos.length,
          },
        },
        {
          onSuccess: (data) => {
            console.log('Checkout created:', data);
            console.log('Setting status to payment_pending');
            setCheckoutStatus('payment_pending');

            // Store the transaction ID for the realtime subscription
            if (data.transactionId) {
              setCurrentTransactionId(data.transactionId.toString());
            }

            // The realtime subscription will handle creating print orders
          },
          onError: (error) => {
            console.error('Checkout error:', error);
            toast.error(`Checkout error: ${error.message}`);
            setCheckoutStatus(null);
          },
        }
      );
    }
  };

  // If no event is selected, show a message
  if (!selectedEvent?.id) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Photo Gallery Kiosk</CardTitle>
              <CardDescription className="text-center">No event selected</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>Please contact an administrator to set up this kiosk.</p>
            </CardContent>
          </Card>
        </div>

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Show scan help screen
  if (showScanHelp) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <RfidScanHelp
            onBack={() => {
              console.log('Scan help screen closed');
              setShowScanHelp(false);
            }}
          />
        </div>

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Function to reset the form state
  const resetForm = resetToInitialState;

  // Show error state if there was an error fetching student data
  if (studentError) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">{studentError.message}</p>
              <div className="mt-4 flex justify-center">
                <Button onClick={resetForm} size="lg" className="h-12 px-6 text-lg">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Show loading state while fetching student data
  if (isLoadingStudent || isStudentLoading || isFetching) {
    return (
      <>
        <GalleryFallback />

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Show photo gallery if student data is loaded
  if (rfid && studentData && 'student' in studentData && 'images' in studentData) {
    // Count print-ready photos
    const printReadyCount = studentData.images.filter(
      (img: any) => img.purchased_print && img.print_credits > 0
    ).length;

    return (
      <>
        <div className="min-h-screen container mx-auto">
          <GalleryHeader
            title={studentData.student.name}
            subtitle={selectedEvent.name}
            selectedCount={selectedPhotos.length}
            onCheckoutClick={handleCheckout}
            onExitClick={() => setShowExitDialog(true)}
            checkoutButtonText={areAllSelectedPhotosReady ? 'Print Selected' : 'Checkout & Print'}
            checkoutButtonIcon={areAllSelectedPhotosReady ? 'printer' : 'cart'}
          />

          <div className="px-4 mt-6">
            {printReadyCount > 0 && (
              <Alert className="border-0">
                <Info className="h-4 w-4" />
                <AlertDescription className="flex">
                  Photos with a <Printer className="h-4 w-4 inline text-foreground" /> icon are
                  ready to print.
                </AlertDescription>
              </Alert>
            )}

            {studentData.images && studentData.images.length > 0 ? (
              <PhotoGallery
                photos={studentData.images
                  .map((img: any) => ({
                    id: img.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
                    url: img.url || '',
                    isPrintReady: Boolean(img.purchased_print && img.print_credits > 0),
                    originalPath: img.path || '',
                  }))
                  .filter((img) => img.url)}
                onSelectionChange={handleSelectionChange}
                isLoading={checkoutStatus !== null}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No photos found for this student.</p>
                <Button onClick={resetForm} size="lg" className="h-12 px-6 text-lg">
                  Scan Another RFID
                </Button>
              </div>
            )}
          </div>

          {/* Exit Dialog */}
          <ExitDialog
            isOpen={showExitDialog}
            onOpenChange={setShowExitDialog}
            onSuccess={() => {
              console.log('[GalleryMode] Exit dialog success, navigating to admin dashboard');
              navigate({ to: '/admin/event-manager' });
            }}
          />
        </div>

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
        )}
      </>
    );
  }

  // Render checkout status overlay if we're in a checkout flow
  return (
    <>
      {/* Default view - RFID input form */}
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="absolute top-4 left-4 flex justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowExitDialog(true)}
            className="h-10 w-10 rounded-full"
            title="Exit Gallery Mode"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </div>

        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <div className="flex-grow text-center">
              <CardTitle className="text-center text-2xl">Photo Gallery</CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                {selectedEvent.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RfidForm
              onSubmit={handleRfidSubmit}
              onScanHelpClick={() => setShowScanHelp(true)}
              isProcessing={isProcessing}
              label="Scan or enter student gown RFID"
              placeholder="Scan RFID tag..."
            />
          </CardContent>
        </Card>

        {/* Exit Dialog */}
        <ExitDialog
          isOpen={showExitDialog}
          onOpenChange={setShowExitDialog}
          onSuccess={() => {
            console.log('[GalleryMode] Exit dialog success, navigating to admin dashboard');
            navigate({ to: '/admin/event-manager' });
          }}
        />
      </div>

      {/* Checkout status overlay */}
      {checkoutStatus && (
        <CheckoutStatusScreen status={checkoutStatus} onClose={resetToInitialState} />
      )}
    </>
  );
}
