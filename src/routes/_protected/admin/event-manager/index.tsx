import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  Building,
  Calendar,
  Clock,
  Download,
  GraduationCap,
  Loader2,
  ShoppingBag,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useEventStore } from '@/stores/event-store';
import { Event } from '@/types/event';
import {
  allEventBookingsQueryOptions,
  bookingStatsQueryOptions,
  Ceremony,
  detailedGownStatsQueryOptions,
  eventCeremoniesQueryOptions,
} from '@/utils/bookings';
import { fetchBookingById, undoCheckin, undoCheckout } from '@/utils/gown-operations';
import { useAutoSync } from '@/utils/offline/auto-sync';
import { mutationKeys } from '@/utils/offline/mutation-handler';

import { columns, OptimisticBooking } from '@/components/admin/bookings/columns';
import { ClientDataTable } from '@/components/admin/client-data-table';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { GownChangeDialog } from '@/components/admin/gown-change-dialog';
import { GownCheckoutDialog } from '@/components/admin/gown-checkout-dialog';
import { GownStatsPopover } from '@/components/admin/gown-stats-popover';
import { QrScanner } from '@/components/admin/qr-scanner';
import { StatCard } from '@/components/admin/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/admin/event-manager/')({
  loader: () => {
    return {
      title: 'Event Manager',
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  // Get the selected event from the store
  const selectedEvent = useEventStore((state) => state.selectedEvent) as Event | null;
  const selectedEventId = selectedEvent?.id;

  // State for dialogs
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [changeGownDialogOpen, setChangeGownDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // State for confirmation dialogs
  const [undoCheckoutDialogOpen, setUndoCheckoutDialogOpen] = useState(false);
  const [undoCheckinDialogOpen, setUndoCheckinDialogOpen] = useState(false);
  const [bookingToUndo, setBookingToUndo] = useState<any>(null);

  // Network and offline status using TanStack Query's onlineManager
  const { isOnline, isOffline, isOfflineMode, wasOffline, isRestoring } = useOfflineManager({
    onOnline: () => {
      toast.success('Network connection restored');
    },
    onOffline: () => {
      toast.error('Network connection lost - working in offline mode');
    },
  });

  // Auto-sync hook for prefetching and syncing
  const {
    isPrefetching,
    isSyncing,
    hasPendingOps,
    isDataCached,
    isRestoring: isSyncRestoring,
    prefetch: handlePrefetchData,
    sync: syncPendingOperations,
  } = useAutoSync(selectedEventId, {
    enableAutoPrefetch: true,
    enableAutoSync: true,
    showNotifications: true,
  });

  // Set up Supabase realtime subscription for the selected event (only when online)
  useSupabaseRealtime(isOfflineMode ? null : selectedEventId || null);

  // Fetch booking statistics
  const { data: bookingStats, isLoading: isLoadingStats } = useQuery(
    bookingStatsQueryOptions(selectedEventId || 0)
  );

  // Fetch detailed gown statistics
  const { data: detailedGownStats } = useQuery(detailedGownStatsQueryOptions(selectedEventId || 0));

  // Fetch all bookings data for client-side table
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery(
    allEventBookingsQueryOptions(selectedEventId || 0)
  );

  // Fetch ceremonies for the selected event (with error handling)
  const { data: ceremonies } = useQuery(eventCeremoniesQueryOptions(selectedEventId || 0));

  // Define filter configurations
  const statusFilterOptions = [
    { value: 'awaiting_pickup', label: 'Awaiting Pickup' },
    { value: 'collected', label: 'Collected' },
    { value: 'returned', label: 'Returned' },
    { value: 'late', label: 'Late' },
  ];

  const orderTypeFilterOptions = [
    { value: 'HIRE', label: 'Hire' },
    { value: 'EXTENDED_HIRE', label: 'Extended Hire' },
    { value: 'PURCHASE', label: 'Purchase' },
  ];

  // Create ceremony filter options from the fetched ceremonies
  const ceremonyFilterOptions = useMemo(() => {
    if (!ceremonies || ceremonies.length === 0) {
      return [];
    }

    try {
      return ceremonies.map((ceremony: Ceremony) => ({
        value: String(ceremony.id),
        label: ceremony.name || `Ceremony ${ceremony.id}`,
      }));
    } catch (error) {
      console.warn('Error creating ceremony filter options:', error);
      return [];
    }
  }, [ceremonies]);

  // Handle QR code scan
  const handleQrScan = async (data: { bookingId: number }) => {
    try {
      console.log('QR code scanned:', data);

      if (!data.bookingId) {
        toast.error('Invalid QR code. No booking ID found.');
        return;
      }

      // Fetch the booking details (use offline version if in offline mode)
      let booking: any;
      if (isOfflineMode) {
        booking = await fetchBookingById({ data: { bookingId: data.bookingId } });
      } else {
        booking = await fetchBookingById({ data: { bookingId: data.bookingId } });
      }
      console.log('Fetched booking:', booking);

      // Check if the booking is for the selected event
      // The booking.event could be either a number or an object with an id property
      const bookingEventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('Booking event ID:', bookingEventId, 'Selected event ID:', selectedEventId);

      if (bookingEventId !== selectedEventId) {
        toast.error('This booking is for a different event.');
        return;
      }

      // Add the selected event name to the booking data if it's not already there
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      // Set the selected booking and open the appropriate dialog
      setSelectedBooking(booking);
      console.log('Booking status:', booking.booking_status);

      // Check for null or undefined status
      if (!booking.booking_status) {
        console.log('Booking status is null or undefined');
        // Default to checkout dialog if status is missing
        setCheckoutDialogOpen(true);
        return;
      }

      // Handle different status values
      const status = booking.booking_status.toLowerCase();
      const orderType = booking.order_type.toLowerCase();
      console.log('Normalized status:', status);

      if (
        status === 'awaiting_pickup' ||
        status === 'awaiting pickup' ||
        status === null ||
        status === ''
      ) {
        console.log('Opening checkout dialog');
        setCheckoutDialogOpen(true);
      } else if (status === 'collected' || status === 'late') {
        console.log('Checking order type:', booking.order_type);
        if (orderType === 'purchase') {
          toast.info('This gown has been purchased and should not be returned.');
          return;
        }
        console.log('Opening checkin dialog');
        setCheckinDialogOpen(true);
      } else if (status === 'returned') {
        console.log('Gown already returned');
        toast.info('This gown has already been returned.');
      } else {
        console.log('No dialog opened for status:', status);
        // Default to checkout dialog for unknown status
        setCheckoutDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      toast.error(`Error processing QR code: ${error.message}`);
    }
  };

  // Handle row click
  const handleRowClick = (row: any) => {
    console.log('Row clicked:', row);
    console.log('Booking status:', row.booking_status);
    console.log('Order type:', row.order_type);

    // Add the selected event name to the booking data if it's not already there
    if (!row.event_name && selectedEvent) {
      row.event_name = selectedEvent.name;
    }

    setSelectedBooking(row);

    // Check for null or undefined status
    if (!row.booking_status) {
      console.log('Booking status is null or undefined');
      // Default to checkout dialog if status is missing
      setCheckoutDialogOpen(true);
      return;
    }

    // Handle different status values
    const status = row.booking_status.toLowerCase();
    console.log('Normalized status:', status);

    if (
      status === 'awaiting_pickup' ||
      status === 'awaiting pickup' ||
      status === null ||
      status === ''
    ) {
      console.log('Opening checkout dialog');
      setCheckoutDialogOpen(true);
    } else if (status === 'collected' || status === 'late') {
      // Check if the order type is PURCHASE directly from the row data
      console.log('Checking order type:', row.order_type);
      if (row.order_type === 'PURCHASE') {
        toast.info('This gown has been purchased and should not be returned.');
        return;
      }
      console.log('Opening checkin dialog');
      setCheckinDialogOpen(true);
    } else if (status === 'returned') {
      console.log('Gown already returned');
      toast.info('This gown has already been returned.');
    } else {
      console.log('No dialog opened for status:', status);
      // Default to checkout dialog for unknown status
      setCheckoutDialogOpen(true);
    }
  };

  // Set up mutations for undo operations
  const queryClient = useQueryClient();

  // Check for pending operations on mount and when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && hasPendingOps) {
      toast.info('You have pending operations to sync', {
        action: {
          label: 'Sync Now',
          onClick: () => syncPendingOperations(),
        },
      });
    }
  }, [isOnline, wasOffline, hasPendingOps, syncPendingOperations]);

  const undoCheckoutMutation = useMutation({
    mutationKey: mutationKeys.undoCheckout(),
    mutationFn: (data: { bookingId: number; eventId: number }) => {
      return undoCheckout({ data: { bookingId: data.bookingId } });
    },
    onSuccess: () => {
      toast.success('Check-out has been undone successfully');
      queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookingStats'] });
    },
    onError: (error: Error) => {
      console.error('Error undoing check-out:', error.message);
      toast.error(`Error undoing check-out: ${error.message}`);
    },
  });

  const undoCheckinMutation = useMutation({
    mutationKey: mutationKeys.undoCheckin(),
    mutationFn: (data: { bookingId: number; eventId: number }) => {
      return undoCheckin({ data: { bookingId: data.bookingId } });
    },
    onSuccess: () => {
      toast.success('Check-in has been undone successfully');
      queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookingStats'] });
    },
    onError: (error: Error) => {
      console.error('Error undoing check-in:', error.message);
      toast.error(`Error undoing check-in: ${error.message}`);
    },
  });

  // Event handler functions with useCallback to prevent unnecessary re-renders
  const handleCheckout = useCallback(
    (e: CustomEvent) => {
      console.log('Checkout event received:', e.detail.booking);

      // Add the selected event name to the booking data if it's not already there
      const booking = e.detail.booking;
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      setSelectedBooking(booking);
      setCheckoutDialogOpen(true);
    },
    [selectedEvent]
  );

  const handleCheckin = useCallback(
    (e: CustomEvent) => {
      console.log('Checkin event received:', e.detail.booking);

      // Add the selected event name to the booking data if it's not already there
      const booking = e.detail.booking;
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      setSelectedBooking(booking);
      setCheckinDialogOpen(true);
    },
    [selectedEvent]
  );

  const handleChangeGown = useCallback(
    (e: CustomEvent) => {
      console.log('Change gown event received:', e.detail.booking);

      // Add the selected event name to the booking data if it's not already there
      const booking = e.detail.booking;
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      setSelectedBooking(booking);
      setChangeGownDialogOpen(true);
    },
    [selectedEvent]
  );

  const handleUndoCheckout = useCallback(
    (e: CustomEvent) => {
      console.log('Undo checkout event received:', e.detail.booking);

      const booking = e.detail.booking;
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      // Set the booking to undo and open the confirmation dialog
      setBookingToUndo(booking);
      setUndoCheckoutDialogOpen(true);
    },
    [selectedEvent]
  );

  // Handle confirmation of undo checkout
  const confirmUndoCheckout = useCallback(() => {
    if (bookingToUndo && typeof selectedEventId === 'number') {
      undoCheckoutMutation.mutate({ bookingId: bookingToUndo.id, eventId: selectedEventId });

      // Show toast for offline mode immediately
      if (isOfflineMode) {
        toast.success('Undo checkout operation queued for processing');
      }
    }
    setUndoCheckoutDialogOpen(false);
  }, [bookingToUndo, undoCheckoutMutation, isOfflineMode, selectedEventId]);

  const handleUndoCheckin = useCallback(
    (e: CustomEvent) => {
      console.log('Undo checkin event received:', e.detail.booking);

      const booking = e.detail.booking;
      if (!booking.event_name && selectedEvent) {
        booking.event_name = selectedEvent.name;
      }

      // Set the booking to undo and open the confirmation dialog
      setBookingToUndo(booking);
      setUndoCheckinDialogOpen(true);
    },
    [selectedEvent]
  );

  // Handle confirmation of undo checkin
  const confirmUndoCheckin = useCallback(() => {
    if (bookingToUndo && typeof selectedEventId === 'number') {
      undoCheckinMutation.mutate({ bookingId: bookingToUndo.id, eventId: selectedEventId });

      // Show toast for offline mode immediately
      if (isOfflineMode) {
        toast.success('Undo check-in operation queued for processing');
      }
    }
    setUndoCheckinDialogOpen(false);
  }, [bookingToUndo, undoCheckinMutation, isOfflineMode, selectedEventId]);

  // Function to process bookings and add ceremony information
  const processBookingsWithPendingFlags = useCallback(
    (bookings: any[]): OptimisticBooking[] => {
      // Process bookings to add ceremony name and ensure optimistic fields exist
      const processedBookings = bookings.map((booking) => {
        // Find the ceremony for this booking
        const ceremony = ceremonies?.find((c) => c.id === booking.ceremony_id);

        // Return the booking with ceremony information and optimistic fields
        return {
          ...booking,
          ceremony: ceremony ? { name: ceremony.name } : null,
          pendingCheckout: booking.pendingCheckout ?? false,
          pendingCheckin: booking.pendingCheckin ?? false,
          pendingUndoCheckout: booking.pendingUndoCheckout ?? false,
          pendingUndoCheckin: booking.pendingUndoCheckin ?? false,
          pendingGownChange: booking.pendingGownChange ?? false,
        };
      });

      return processedBookings;
    },
    [ceremonies]
  );

  // Function to refresh the bookings data
  const refreshBookingsData = useCallback(async () => {
    if (!selectedEventId) return;

    // Invalidate the bookings query to refresh the data
    queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
  }, [selectedEventId, queryClient]);

  // Refresh bookings data when offline mode changes
  useEffect(() => {
    if (isOfflineMode && bookingsData && bookingsData.length > 0) {
      refreshBookingsData();
    }
  }, [isOfflineMode, bookingsData, refreshBookingsData]);

  // Set up a polling mechanism to refresh data when offline
  useEffect(() => {
    if (isOfflineMode && selectedEventId) {
      // Set up a polling interval to refresh the data
      const intervalId = setInterval(() => {
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
        queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookingStats'] });

        // Refresh bookings data
        refreshBookingsData();
      }, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isOfflineMode, selectedEventId, queryClient, refreshBookingsData]);

  // Listen for custom events from the action buttons
  useEffect(() => {
    document.addEventListener('checkout-gown', handleCheckout as EventListener);
    document.addEventListener('checkin-gown', handleCheckin as EventListener);
    document.addEventListener('change-gown', handleChangeGown as EventListener);
    document.addEventListener('undo-checkout', handleUndoCheckout as EventListener);
    document.addEventListener('undo-checkin', handleUndoCheckin as EventListener);

    return () => {
      document.removeEventListener('checkout-gown', handleCheckout as EventListener);
      document.removeEventListener('checkin-gown', handleCheckin as EventListener);
      document.removeEventListener('change-gown', handleChangeGown as EventListener);
      document.removeEventListener('undo-checkout', handleUndoCheckout as EventListener);
      document.removeEventListener('undo-checkin', handleUndoCheckin as EventListener);
    };
  }, [handleCheckout, handleCheckin, handleChangeGown, handleUndoCheckout, handleUndoCheckin]);

  // If no event is selected, show a message
  if (!selectedEventId) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <p>Please select an event from the sidebar to view statistics and bookings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">{selectedEvent?.name}</CardTitle>
              {selectedEvent?.organization && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Event ID: {selectedEvent.id}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedEvent.organization.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row items-end gap-2">
              {/* Network Status Indicator */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-md ${isOfflineMode || isRestoring ? 'bg-amber-100 dark:bg-amber-900' : 'bg-muted'}`}
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      Restoring Data...
                    </span>
                  </>
                ) : isOfflineMode ? (
                  <>
                    <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">Offline Mode</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Online</span>
                  </>
                )}
              </div>

              {/* Offline Mode Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrefetchData}
                  disabled={
                    isPrefetching || !isOnline || isDataCached || isRestoring || isSyncRestoring
                  }
                  className={`flex items-center gap-1 ${isDataCached ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : ''}`}
                >
                  {isPrefetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isPrefetching
                    ? 'Prefetching...'
                    : isRestoring || isSyncRestoring
                      ? 'Restoring...'
                      : isDataCached
                        ? 'Data Cached'
                        : 'Prefetch Data'}
                </Button>

                {/* Offline mode toggle removed */}

                {hasPendingOps && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncPendingOperations}
                    disabled={isSyncing || !isOnline || isRestoring || isSyncRestoring}
                    className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  >
                    <Upload className="h-4 w-4" />
                    {isSyncing ? 'Syncing...' : 'Sync Changes'}
                  </Button>
                )}
              </div>

              {/* Event Date */}
              {selectedEvent?.datetime && (
                <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(selectedEvent.datetime), 'PPP p')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoadingStats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title={
                <div className="flex items-center gap-2">
                  <GownStatsPopover
                    gownCounts={detailedGownStats?.gown_counts || []}
                    detailedCounts={detailedGownStats?.detailed_counts || []}
                    hasMappings={detailedGownStats?.has_mapping || false}
                  />
                  <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Wifi className="h-3 w-3 mr-1" /> Live
                  </span>
                </div>
              }
              value={`${bookingStats?.collected_count || 0} / ${(bookingStats?.total_count || 0) - (bookingStats?.purchase_count || 0)}`}
              description="Number of gowns currently checked out vs. total gowns to be checked out"
              icon={GraduationCap}
            />
            <StatCard
              title={
                <div className="flex items-center gap-2">
                  Late Gowns
                  <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Wifi className="h-3 w-3 mr-1" /> Live
                  </span>
                </div>
              }
              value={bookingStats?.late_count || 0}
              description="Number of gowns that are currently marked as late"
              icon={Clock}
              iconClassName="text-destructive"
            />
            <StatCard
              title={
                <div className="flex items-center gap-2">
                  Purchased Gowns
                  <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Wifi className="h-3 w-3 mr-1" /> Live
                  </span>
                </div>
              }
              value={bookingStats?.purchase_count || 0}
              description="Number of gowns that were purchased"
              icon={ShoppingBag}
            />
          </>
        )}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Bookings
              <span className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Wifi className="h-3 w-3 mr-1" /> Live Updates
              </span>
            </CardTitle>
            <CardDescription>View and manage all bookings for this event</CardDescription>
          </div>
          <QrScanner
            onScan={handleQrScan}
            buttonText="Scan QR Code"
            dialogTitle="Scan Student QR Code"
          />
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <ClientDataTable
              columns={columns}
              data={processBookingsWithPendingFlags(bookingsData || [])}
              onRowClick={handleRowClick}
              filters={[
                {
                  id: 'booking_status',
                  label: 'Status',
                  options: statusFilterOptions,
                  pluralLabel: 'Statuses',
                },
                {
                  id: 'order_type',
                  label: 'Order Type',
                  options: orderTypeFilterOptions,
                  pluralLabel: 'Order Types',
                },
                {
                  id: 'ceremony',
                  label: 'Ceremony',
                  options: ceremonyFilterOptions,
                  pluralLabel: 'Ceremonies',
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedBooking && (
        <>
          <GownCheckoutDialog
            isOpen={checkoutDialogOpen}
            onOpenChange={setCheckoutDialogOpen}
            booking={selectedBooking}
            mode="checkout"
            selectedEventName={selectedEvent?.name}
            onSuccess={() => {
              // Refetch data after successful check-out
              queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
              queryClient.invalidateQueries({
                queryKey: ['event', selectedEventId, 'bookingStats'],
              });
            }}
          />

          <GownCheckoutDialog
            isOpen={checkinDialogOpen}
            onOpenChange={setCheckinDialogOpen}
            booking={selectedBooking}
            mode="checkin"
            selectedEventName={selectedEvent?.name}
            onSuccess={() => {
              // Refetch data after successful check-in
              queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
              queryClient.invalidateQueries({
                queryKey: ['event', selectedEventId, 'bookingStats'],
              });
            }}
          />

          <GownChangeDialog
            isOpen={changeGownDialogOpen}
            onOpenChange={setChangeGownDialogOpen}
            booking={selectedBooking}
            selectedEventName={selectedEvent?.name}
            onSuccess={() => {
              // Refetch data after successful gown change
              queryClient.invalidateQueries({ queryKey: ['event', selectedEventId, 'bookings'] });
              queryClient.invalidateQueries({
                queryKey: ['event', selectedEventId, 'bookingStats'],
              });
            }}
          />
        </>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={undoCheckoutDialogOpen}
        onOpenChange={setUndoCheckoutDialogOpen}
        title="Undo Checkout"
        description="Are you sure you want to undo the check-out for this booking? This will reset the booking status to 'awaiting pickup' and mark the gown as available."
        confirmText="Undo Checkout"
        onConfirm={confirmUndoCheckout}
      />

      <ConfirmationDialog
        isOpen={undoCheckinDialogOpen}
        onOpenChange={setUndoCheckinDialogOpen}
        title="Undo Check-in"
        description="Are you sure you want to undo the check-in for this booking? This will reset the booking status to 'collected' and mark the gown as checked out."
        confirmText="Undo Check-in"
        onConfirm={confirmUndoCheckin}
      />
    </div>
  );
}
