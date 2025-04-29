import { Suspense } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { hasRouteAccess } from '@/utils/route-access';
import {
  deleteOffer,
  duplicateOffer,
  offerDetailQueryOptions,
  updateOffer,
} from '@/utils/all-offers';
import { allEventsQueryOptions } from '@/utils/all-events';

import { EditableOfferCard } from '@/components/admin/offers/editable-offer-card';
import { EventAssociationTable } from '@/components/admin/offers/event-association-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnauthorizedError } from '@/components/unauthorized';

export const Route = createFileRoute('/_protected/admin/offers/$offerId')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/offers');

    if (!hasAccess) {
      console.log('[OfferDetailRoute] User does not have access to offers');
      throw new Error('Unauthorized');
    }

    return {
      title: 'Offer Details',
    };
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Unauthorized') {
      return (
        <div className="min-h-screen bg-background">
          <UnauthorizedError />
        </div>
      );
    }
    throw error;
  },
  loader: async ({ context, params }) => {
    const offerId = params.offerId;
    const queryClient = context.queryClient;

    try {
      // Prefetch the offer data and prime the cache
      const offer = await queryClient.fetchQuery(offerDetailQueryOptions(offerId));

      return {
        offerId,
        title: offer?.title ? `Offer | ${offer.title}` : 'Offer Details',
      };
    } catch (error) {
      console.error('Error fetching offer data:', error);
      return {
        offerId,
        title: 'Offer Details',
      };
    }
  },
  component: OfferDetailRoute,
});

function OfferDetailRoute() {
  const { offerId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch offer details - this will use the cached data from the loader
  const { data: offer, isLoading: isLoadingOffer } = useSuspenseQuery(
    offerDetailQueryOptions(offerId)
  );

  // Fetch all events for the association table
  const { data: events, isLoading: isLoadingEvents } = useSuspenseQuery(allEventsQueryOptions());

  // Mutation for updating offer
  const updateOfferMutation = useMutation({
    mutationFn: updateOffer,
    onSuccess: () => {
      // Invalidate offer detail query to refresh data
      queryClient.invalidateQueries({ queryKey: ['offers', 'detail', offerId] });
      // Invalidate all offers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['offers', 'all'] });
      toast.success('Offer updated successfully');
    },
    onError: (error) => {
      toast.error(`Error updating offer: ${error.message}`);
    },
  });

  // Mutation for deleting an offer
  const deleteOfferMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      // Invalidate offers query to refresh data
      queryClient.invalidateQueries({ queryKey: ['offers', 'all'] });
      toast.success('Offer deleted successfully');
      // Navigate back to the offers list
      navigate({ to: '/admin/offers' });
    },
    onError: (error) => {
      toast.error(`Error deleting offer: ${error.message}`);
    },
  });

  // Mutation for duplicating an offer
  const duplicateOfferMutation = useMutation({
    mutationFn: duplicateOffer,
    onSuccess: (newOffer) => {
      // Invalidate offers query to refresh data
      queryClient.invalidateQueries({ queryKey: ['offers', 'all'] });
      toast.success('Offer duplicated successfully');
      // Navigate to the new offer's detail page
      navigate({ to: `/admin/offers/${newOffer.id}` });
    },
    onError: (error) => {
      toast.error(`Error duplicating offer: ${error.message}`);
    },
  });

  // Handle offer update
  const handleOfferUpdate = (updatedOffer: any) => {
    updateOfferMutation.mutate({
      data: {
        offerId,
        ...updatedOffer,
      },
    });
  };

  // Handle delete offer
  const handleConfirmDelete = () => {
    console.log('Deleting offer with ID:', offerId);
    deleteOfferMutation.mutate({ data: { offerId } });
  };

  // Handle duplicate offer
  const handleDuplicateOffer = () => {
    console.log('Duplicating offer with ID:', offerId);
    duplicateOfferMutation.mutate({ data: { offerId } });
  };

  if (isLoadingOffer || isLoadingEvents) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        {/* Header with back button and action buttons */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate({ to: '/admin/offers' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Offers
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDuplicateOffer}
              disabled={duplicateOfferMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteOfferMutation.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the offer and remove
                    it from any associated events.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs for offer editing and events */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="events">Associated Events</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="w-full p-8 rounded-lg bg-input">
              <div className="max-w-md mx-auto">
                <EditableOfferCard offer={offer} onUpdate={handleOfferUpdate} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Associated Events</h2>
              <Suspense fallback={<div className="text-center py-4">Loading associations...</div>}>
                <EventAssociationTable offerId={offerId} events={events || []} />
              </Suspense>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
