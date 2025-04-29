import { useState } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Mail } from 'lucide-react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { getBackToListOptions } from '@/utils/navigation';
import {
  deleteGownCompositionSet,
  gownCompositionSetsQueryOptions,
  setActiveGownCompositionSet,
} from '@/utils/gown-compositions';
import {
  addScheduleItem,
  deleteScheduleItem,
  eventFeaturesQueryOptions,
  eventOffersQueryOptions,
  eventQueryOptions,
  eventScheduleItemsQueryOptions,
  generateInviteLinks,
  updateEvent,
  updateFeatureOrder,
  updateOfferOrder,
  updateScheduleItem,
} from '@/utils/events';
import { processScheduleItem } from '@/utils/ai/process-schedule-item.server';

import { GownCompositionUpload } from '@/components/admin/gown-composition-upload';
import { GownSchemaManager } from '@/components/admin/gown-schema-manager';
import {
  ErrorBoundary,
  EventDetailsError,
  FeaturesError,
  OffersError,
  ScheduleItemsError,
} from '@/components/error-boundary';
import { EventFormValues, FeatureList, OfferList, ScheduleItemList } from '@/components/events';
// Import components directly to avoid TypeScript caching issues
import { EventDetailsForm } from '@/components/events/event-details-form';
import {
  EventDetailsFallback,
  FeaturesFallback,
  OffersFallback,
  ScheduleItemsFallback,
  SuspenseWrapper,
} from '@/components/suspense-wrapper';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Type definitions
interface ScheduleItem {
  id: string;
  title: string | null;
  description: string | null;
  timestamp: string | null;
  event_id: number | null;
}

interface Offer {
  offer_id: string;
  event_id: number;
  index: number | null;
  offer: {
    id: string;
    title: string | null;
    discount_value: number | null;
    offer_type: 'percentage_off' | 'amount_off' | null;
  } | null;
}

interface Feature {
  feature_id: string;
  event_id: number;
  index: number | null;
  feature: {
    id: string;
    title: string | null;
    subtitle: string | null;
    link: string | null;
  } | null;
}

// Zod schema for form validation
const eventFormSchema = z.object({
  name: z.string().min(1, { message: 'Event name is required' }),
  datetime: z.date().optional(),
  gownCollectionLocation: z.string().optional().default(''),
  printingEndTime: z.date().optional(),
  isGownsOnly: z.boolean().default(false),
  faceIdEnabled: z.boolean().default(false),
});

// EventData type is now imported from '@/components/events'

interface ScheduleItem {
  id: string;
  title: string | null;
  description: string | null;
  timestamp: string | null;
  event_id: number | null;
}

interface Offer {
  offer_id: string;
  event_id: number;
  index: number | null;
  offer: {
    id: string;
    title: string | null;
    discount_value: number | null;
    offer_type: 'percentage_off' | 'amount_off' | null;
  } | null;
}

interface Feature {
  feature_id: string;
  event_id: number;
  index: number | null;
  feature: {
    id: string;
    title: string | null;
    subtitle: string | null;
    link: string | null;
  } | null;
}

// No longer needed with TanStack Query
// interface LoaderData {
//   event: EventData
//   scheduleItems: ScheduleItem[]
//   offers: Offer[]
//   features: Feature[]
// }

export const Route = createFileRoute('/_protected/admin/events/$eventId')({
  // Error boundary component
  errorComponent: ({ error }) => {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading event</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message || 'An unknown error occurred'}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/admin/events"
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Back to Events List
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  loader: ({ params }) => {
    return {
      eventId: params.eventId,
      title: `Event ${params.eventId}`,
    };
  },
  component: EventDetailRoute,
});

function EventDetailRoute() {
  const navigate = useNavigate();
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch event data using suspense queries
  const eventQuery = useSuspenseQuery(eventQueryOptions(eventId));
  const scheduleItemsQuery = useSuspenseQuery(eventScheduleItemsQueryOptions(eventId));
  const offersQuery = useSuspenseQuery(eventOffersQueryOptions(eventId));
  const featuresQuery = useSuspenseQuery(eventFeaturesQueryOptions(eventId));

  // Extract data from queries
  const event = eventQuery.data;
  const [scheduleItems, setScheduleItems] = useState(scheduleItemsQuery.data);
  const [offers, setOffers] = useState(offersQuery.data);
  const [features, setFeatures] = useState(featuresQuery.data);
  const [activeTab, setActiveTab] = useState('details');
  const [showInviteLinksDialog, setShowInviteLinksDialog] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<
    Array<{
      firstName: string | null;
      surname: string | null;
      fullName: string | null;
      email: string;
      inviteLink: string;
      orderId: string | null;
    }>
  >([]);

  // Set up mutation for generating invite links
  const generateInviteLinksMutation = useMutation({
    mutationFn: (data: { eventId: string }) => {
      return generateInviteLinks({ data });
    },
    onSuccess: (data) => {
      setInviteLinks(data.inviteLinks);
      setShowInviteLinksDialog(true);
      toast.success(`Generated ${data.inviteLinks.length} invite links successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to generate invite links: ${error.message}`);
    },
  });

  // Fetch gown composition sets for this event
  const { data: compositionSets, refetch: refetchCompositionSets } = useSuspenseQuery(
    gownCompositionSetsQueryOptions(parseInt(eventId))
  );

  // Set up mutation for setting a composition set as active
  const setActiveCompositionSetMutation = useMutation({
    mutationFn: (compositionSetId: number) => {
      return setActiveGownCompositionSet({ data: { compositionSetId } });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'gownCompositionSets'] });
      // Explicitly refetch the data
      refetchCompositionSets();
      toast.success('Composition set activated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to activate composition set: ${error.message}`);
    },
  });

  // Set up mutation for updating event
  const updateEventMutation = useMutation({
    mutationFn: (data: {
      eventId: string;
      name: string;
      datetime?: Date | null;
      gownCollectionLocation?: string | null;
      printingEndTime?: Date | null;
      isGownsOnly?: boolean | null;
      faceIdEnabled?: boolean | null;
    }) => {
      return updateEvent({ data });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  // Set up mutation for schedule items
  const addScheduleItemMutation = useMutation({
    mutationFn: (data: {
      eventId: string;
      title: string | null;
      description: string | null;
      timestamp: string | null;
    }) => {
      return addScheduleItem({ data });
    },
    onSuccess: (data) => {
      // Update local state
      setScheduleItems((prev) => [...prev, data]);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'scheduleItems'] });
      toast.success('Schedule item added successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to add schedule item: ${error.message}`);
    },
  });

  const updateScheduleItemMutation = useMutation({
    mutationFn: (data: {
      id: string;
      title?: string | null;
      description?: string | null;
      timestamp?: string | null;
    }) => {
      return updateScheduleItem({ data });
    },
    onSuccess: (data) => {
      // Update local state
      setScheduleItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'scheduleItems'] });
      toast.success('Schedule item updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update schedule item: ${error.message}`);
    },
  });

  const deleteScheduleItemMutation = useMutation({
    mutationFn: (data: { id: string }) => {
      return deleteScheduleItem({ data });
    },
    onSuccess: (_, variables) => {
      // Update local state
      setScheduleItems((prev) => prev.filter((item) => item.id !== variables.id));
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'scheduleItems'] });
      toast.success('Schedule item deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule item: ${error.message}`);
    },
  });

  // Set up mutation for offer order
  const updateOfferOrderMutation = useMutation({
    mutationFn: (data: {
      offers: Array<{
        offer_id: string;
        event_id: number;
        index: number | null;
      }>;
    }) => {
      return updateOfferOrder({ data });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'offers'] });
      toast.success('Offer order updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update offer order: ${error.message}`);
    },
  });

  // Set up mutation for feature order
  const updateFeatureOrderMutation = useMutation({
    mutationFn: (data: {
      features: Array<{
        feature_id: string;
        event_id: number;
        index: number | null;
      }>;
    }) => {
      return updateFeatureOrder({ data });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'features'] });
      toast.success('Feature order updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update feature order: ${error.message}`);
    },
  });

  const defaultValues = {
    name: event.name ?? '',
    datetime: event.datetime ? new Date(event.datetime) : (undefined as Date | undefined),
    gownCollectionLocation: event.gown_collection_location ?? '',
    printingEndTime: event.printing_end_time
      ? new Date(event.printing_end_time)
      : (undefined as Date | undefined),
    isGownsOnly: event.is_gowns_only ?? false,
    faceIdEnabled: event.face_id_enabled ?? false,
  };

  // Initialize react-hook-form with zod resolver
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues,
    mode: 'onSubmit', // Changed from 'onChange' to prevent automatic submission
  });

  // Handle navigation back to events list with required search params
  const handleBackClick = () => {
    if (form.formState.isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(getBackToListOptions('events'));
      }
    } else {
      navigate(getBackToListOptions('events'));
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    console.log('Form submitted with values:', data);

    updateEventMutation.mutate({
      eventId,
      name: data.name,
      datetime: data.datetime,
      gownCollectionLocation: data.gownCollectionLocation,
      printingEndTime: data.printingEndTime,
      isGownsOnly: data.isGownsOnly,
      faceIdEnabled: data.faceIdEnabled,
    });

    // Reset form state after successful submission
    form.reset(data);
  };

  // Handle drag end for reordering
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    // If there's no destination or the item was dropped back in its original position, do nothing
    if (
      !destination ||
      (destination.droppableId === source.droppableId && destination.index === source.index)
    ) {
      return;
    }

    // Handle offers reordering
    if (source.droppableId === 'offers') {
      const newOffers = Array.from(offers);
      const [movedOffer] = newOffers.splice(source.index, 1);
      newOffers.splice(destination.index, 0, movedOffer);

      // Update the index property for each offer
      const updatedOffers = newOffers.map((offer, index) => ({
        ...offer,
        index,
      }));

      // Update the state
      setOffers(updatedOffers);

      // Save the new order to the database using mutation
      const updates = updatedOffers.map((offer) => ({
        offer_id: offer.offer_id,
        event_id: event.id,
        index: offer.index,
      }));

      updateOfferOrderMutation.mutate({ offers: updates });
    }

    // Handle features reordering
    if (source.droppableId === 'features') {
      const newFeatures = Array.from(features);
      const [movedFeature] = newFeatures.splice(source.index, 1);
      newFeatures.splice(destination.index, 0, movedFeature);

      // Update the index property for each feature
      const updatedFeatures = newFeatures.map((feature, index) => ({
        ...feature,
        index,
      }));

      // Update the state
      setFeatures(updatedFeatures);

      // Save the new order to the database using mutation
      const updates = updatedFeatures.map((feature) => ({
        feature_id: feature.feature_id,
        event_id: event.id,
        index: feature.index,
      }));

      updateFeatureOrderMutation.mutate({ features: updates });
    }
  };

  // Handle adding a schedule item
  const handleAddScheduleItem = async (item: Omit<ScheduleItem, 'id'>) => {
    // Special case for refreshing items after bulk import
    if (item.title === '__REFRESH_ITEMS__') {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'scheduleItems'] });
      toast.success('Schedule items refreshed successfully!');
      return;
    }

    try {
      // Process the natural language input
      const processedItem = await processScheduleItem({ data: { input: item.title || '' } });

      // Use the mutation to add the schedule item
      addScheduleItemMutation.mutate({
        eventId: eventId,
        title: processedItem.title,
        description: item.description,
        timestamp: processedItem.timestamp,
      });
    } catch (error) {
      console.error('Error processing schedule item:', error);
      toast.error('Failed to process schedule item. Please try again.');
    }
  };

  // Handle editing a schedule item
  const handleEditScheduleItem = async (id: string, item: Partial<ScheduleItem>) => {
    try {
      // If the title is being edited and it looks like natural language, process it
      let processedTitle = item.title;
      let processedTimestamp = item.timestamp;

      if (item.title && !item.timestamp) {
        // This might be a natural language input, try to process it
        try {
          const processedItem = await processScheduleItem({ data: { input: item.title } });
          if (processedItem.timestamp) {
            processedTitle = processedItem.title;
            processedTimestamp = processedItem.timestamp;
          }
        } catch (processingError) {
          console.error('Error processing natural language:', processingError);
          // Continue with the original title if processing fails
        }
      }

      // Use the mutation to update the schedule item
      updateScheduleItemMutation.mutate({
        id,
        title: processedTitle,
        description: item.description,
        timestamp: processedTimestamp,
      });
    } catch (error) {
      console.error('Error updating schedule item:', error);
      toast.error('Failed to update schedule item. Please try again.');
    }
  };

  // Handle deleting a schedule item
  const handleDeleteScheduleItem = async (id: string) => {
    // Use the mutation to delete the schedule item
    deleteScheduleItemMutation.mutate({ id });
  };

  // Handle adding an offer
  const handleAddOffer = async (offerData: Partial<Offer['offer']>) => {
    try {
      const supabase = createBrowserClient();

      // First, create a new offer record
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert({
          title: offerData?.title || null,
          discount_value: offerData?.discount_value || null,
          offer_type: offerData?.offer_type || null,
        })
        .select()
        .single();

      if (offerError) throw offerError;
      if (!newOffer) throw new Error('Failed to create offer');

      // Then, create the relationship between the event and the offer
      const { data: eventOffer, error: relationshipError } = await supabase
        .from('event_offers')
        .insert({
          event_id: event.id,
          offer_id: newOffer.id,
          index: offers.length, // Add to the end of the list
        })
        .select()
        .single();

      if (relationshipError) throw relationshipError;
      if (!eventOffer) throw new Error('Failed to link offer to event');

      // Update the UI
      setOffers((prev) => [
        ...prev,
        {
          offer_id: newOffer.id,
          event_id: event.id,
          index: offers.length,
          offer: newOffer,
        },
      ]);

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'offers'] });
      toast.success('Offer added successfully!');
    } catch (error) {
      console.error('Error adding offer:', error);
      toast.error('Failed to add offer. Please try again.');
    }
  };

  // Handle editing an offer
  const handleEditOffer = async (id: string, offerData: Partial<Offer['offer']>) => {
    try {
      const supabase = createBrowserClient();

      // Find the existing offer
      const existingOffer = offers.find((o) => o.offer_id === id);
      if (!existingOffer || !existingOffer.offer) {
        throw new Error('Offer not found');
      }

      // Merge the existing offer with the new data
      const updatedOffer = { ...existingOffer.offer, ...offerData };

      // First, update the offer record
      const { error: offerError } = await supabase
        .from('offers')
        .update({
          title: updatedOffer.title || null,
          discount_value: updatedOffer.discount_value || null,
          offer_type: updatedOffer.offer_type || null,
        })
        .eq('id', updatedOffer.id);

      if (offerError) throw offerError;

      // Update the UI
      setOffers((prev) =>
        prev.map((offerItem) =>
          offerItem.offer_id === id
            ? {
                ...offerItem,
                offer: {
                  ...(offerItem.offer || {}),
                  ...updatedOffer,
                } as Offer['offer'],
              }
            : offerItem
        )
      );

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'offers'] });
      toast.success('Offer updated successfully!');
    } catch (error) {
      console.error('Error updating offer:', error);
      toast.error('Failed to update offer. Please try again.');
    }
  };

  // Handle deleting an offer
  const handleDeleteOffer = async (id: string) => {
    try {
      const supabase = createBrowserClient();

      // First, find the offer to get its ID
      const offerToDelete = offers.find((o) => o.offer_id === id);
      if (!offerToDelete) throw new Error('Offer not found');

      // Delete the relationship in event_offers table
      const { error: relationshipError } = await supabase
        .from('event_offers')
        .delete()
        .eq('offer_id', id)
        .eq('event_id', event.id);

      if (relationshipError) throw relationshipError;

      // Update the UI
      setOffers((prev) => prev.filter((offerItem) => offerItem.offer_id !== id));

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'offers'] });
      toast.success('Offer removed from event successfully!');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer. Please try again.');
    }
  };

  // Handle adding a feature
  const handleAddFeature = async (featureData: Partial<Feature['feature']>) => {
    try {
      const supabase = createBrowserClient();

      // First, create a new feature record
      const { data: newFeature, error: featureError } = await supabase
        .from('features')
        .insert({
          title: featureData?.title || null,
          subtitle: featureData?.subtitle || null,
          link: featureData?.link || null,
        })
        .select()
        .single();

      if (featureError) throw featureError;
      if (!newFeature) throw new Error('Failed to create feature');

      // Then, create the relationship between the event and the feature
      const { data: eventFeature, error: relationshipError } = await supabase
        .from('event_features')
        .insert({
          event_id: event.id,
          feature_id: newFeature.id,
          index: features.length, // Add to the end of the list
        })
        .select()
        .single();

      if (relationshipError) throw relationshipError;
      if (!eventFeature) throw new Error('Failed to link feature to event');

      // Update the UI
      setFeatures((prev) => [
        ...prev,
        {
          feature_id: newFeature.id,
          event_id: event.id,
          index: features.length,
          feature: newFeature,
        },
      ]);

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'features'] });
      toast.success('Feature added successfully!');
    } catch (error) {
      console.error('Error adding feature:', error);
      toast.error('Failed to add feature. Please try again.');
    }
  };

  // Handle editing a feature
  const handleEditFeature = async (id: string, featureData: Partial<Feature['feature']>) => {
    try {
      const supabase = createBrowserClient();

      // Find the existing feature
      const existingFeature = features.find((f) => f.feature_id === id);
      if (!existingFeature || !existingFeature.feature) {
        throw new Error('Feature not found');
      }

      // Merge the existing feature with the new data
      const updatedFeature = { ...existingFeature.feature, ...featureData };

      // First, update the feature record
      const { error: featureError } = await supabase
        .from('features')
        .update({
          title: updatedFeature.title || null,
          subtitle: updatedFeature.subtitle || null,
          link: updatedFeature.link || null,
        })
        .eq('id', updatedFeature.id);

      if (featureError) throw featureError;

      // Update the UI
      setFeatures((prev) =>
        prev.map((featureItem) =>
          featureItem.feature_id === id
            ? {
                ...featureItem,
                feature: {
                  ...(featureItem.feature || {}),
                  ...updatedFeature,
                } as Feature['feature'],
              }
            : featureItem
        )
      );

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'features'] });
      toast.success('Feature updated successfully!');
    } catch (error) {
      console.error('Error updating feature:', error);
      toast.error('Failed to update feature. Please try again.');
    }
  };

  // Handle deleting a feature
  const handleDeleteFeature = async (id: string) => {
    try {
      const supabase = createBrowserClient();

      // First, find the feature to get its ID
      const featureToDelete = features.find((f) => f.feature_id === id);
      if (!featureToDelete) throw new Error('Feature not found');

      // Delete the relationship in event_features table
      const { error: relationshipError } = await supabase
        .from('event_features')
        .delete()
        .eq('feature_id', id)
        .eq('event_id', event.id);

      if (relationshipError) throw relationshipError;

      // Update the UI
      setFeatures((prev) => prev.filter((featureItem) => featureItem.feature_id !== id));

      // Invalidate the query to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'features'] });
      toast.success('Feature removed from event successfully!');
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature. Please try again.');
    }
  };

  // Set up mutation for deleting a composition set
  const deleteCompositionSetMutation = useMutation({
    mutationFn: (data: { compositionSetId: number; name: string }) => {
      return deleteGownCompositionSet({ data: { compositionSetId: data.compositionSetId } });
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'gownCompositionSets'] });
      // Explicitly refetch the data
      refetchCompositionSets();
      toast.success(`Composition set "${variables.name}" deleted successfully!`);
    },
    onError: (error) => {
      toast.error(`Failed to delete composition set: ${error.message}`);
    },
  });

  // Create form methods object for FormProvider
  const methods = form;

  return (
    <FormProvider {...form}>
      <div className="container mx-auto py-10">
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateInviteLinksMutation.mutate({ eventId })}
              disabled={generateInviteLinksMutation.isPending}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {generateInviteLinksMutation.isPending ? 'Generating...' : 'Generate Email Invites'}
            </Button>

            <Button
              type="submit"
              form="event-form"
              disabled={!methods.formState.isDirty}
              variant="default"
            >
              {methods.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Invite Links Dialog */}
        <Dialog open={showInviteLinksDialog} onOpenChange={setShowInviteLinksDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Invite Links Generated</DialogTitle>
              <DialogDescription>
                {inviteLinks.length} invite links have been generated for contacts who haven't
                confirmed their email yet.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteLinks.map((link, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">
                        {link.fullName || `${link.firstName} ${link.surname}`}
                      </td>
                      <td className="py-2 px-4">{link.email}</td>
                      <td className="py-2 px-4">{link.orderId || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowInviteLinksDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="offers">Offers & Features</TabsTrigger>
            <TabsTrigger value="gown-mappings">Gown Compositions</TabsTrigger>
            <TabsTrigger value="gown-schemas">Advanced Schemas</TabsTrigger>
          </TabsList>

          {/* Main content area */}
          <div className="w-full">
            <TabsContent value="details" className="mt-0">
              {/* Main Event Form */}
              <ErrorBoundary fallback={<EventDetailsError />}>
                <SuspenseWrapper fallback={<EventDetailsFallback />}>
                  <form
                    id="event-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Main Event Details */}
                    <EventDetailsForm event={event} />
                  </form>
                </SuspenseWrapper>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              {/* Schedule Items */}
              <ErrorBoundary fallback={<ScheduleItemsError />}>
                <SuspenseWrapper fallback={<ScheduleItemsFallback />}>
                  <ScheduleItemList
                    scheduleItems={scheduleItems}
                    eventId={event.id}
                    onAddItem={handleAddScheduleItem}
                    onEditItem={handleEditScheduleItem}
                    onDeleteItem={handleDeleteScheduleItem}
                  />
                </SuspenseWrapper>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="offers" className="mt-0">
              {/* Offers and Features section - side by side on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offers */}
                <ErrorBoundary fallback={<OffersError />}>
                  <SuspenseWrapper fallback={<OffersFallback />}>
                    <OfferList
                      offers={offers}
                      eventId={event.id}
                      onDragEnd={handleDragEnd}
                      onAddOffer={handleAddOffer}
                      onEditOffer={handleEditOffer}
                      onDeleteOffer={handleDeleteOffer}
                    />
                  </SuspenseWrapper>
                </ErrorBoundary>

                {/* Features */}
                <ErrorBoundary fallback={<FeaturesError />}>
                  <SuspenseWrapper fallback={<FeaturesFallback />}>
                    <FeatureList
                      features={features}
                      eventId={event.id}
                      onDragEnd={handleDragEnd}
                      onAddFeature={handleAddFeature}
                      onEditFeature={handleEditFeature}
                      onDeleteFeature={handleDeleteFeature}
                    />
                  </SuspenseWrapper>
                </ErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="gown-mappings" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Gown Composition Management</h3>
                <Button onClick={() => setActiveTab('gown-schemas')} variant="secondary">
                  Switch to Advanced Schema Management
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GownCompositionUpload eventId={parseInt(eventId)} />

                <div className="border rounded-md p-6 space-y-4">
                  <h3 className="text-lg font-medium">Existing Composition Sets</h3>
                  <p className="text-sm text-muted-foreground">
                    {compositionSets && compositionSets.length > 0
                      ? `${compositionSets.length} composition set(s) available`
                      : 'No composition sets available'}
                  </p>

                  {compositionSets && compositionSets.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {compositionSets.map((set) => (
                        <div key={set.id} className="border rounded-md p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{set.name}</h4>
                              {set.description && (
                                <p className="text-sm text-muted-foreground">{set.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Created {new Date(set.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!set.is_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveCompositionSetMutation.mutate(set.id)}
                                  disabled={setActiveCompositionSetMutation.isPending}
                                >
                                  Set Active
                                </Button>
                              )}
                              {set.is_active && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Active
                                </span>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the
                                      composition set
                                      <strong> "{set.name}"</strong> and all its associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        // Use the mutation to delete the composition set
                                        deleteCompositionSetMutation.mutate({
                                          compositionSetId: set.id,
                                          name: set.name,
                                        });
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm mt-4">
                      Upload a CSV file to create your first gown composition set.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gown-schemas" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Advanced Gown Schema Management</h3>
                <Button onClick={() => setActiveTab('gown-mappings')} variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Basic Compositions
                </Button>
              </div>
              <GownSchemaManager eventId={parseInt(eventId)} existingSchemas={compositionSets} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </FormProvider>
  );
}
