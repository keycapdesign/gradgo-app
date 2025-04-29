import { Suspense } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { hasRouteAccess } from '@/utils/route-access';
import {
  deleteFeature,
  duplicateFeature,
  featureDetailQueryOptions,
  updateFeature,
} from '@/utils/all-features';
import { allEventsQueryOptions } from '@/utils/all-events';

import { EditableFeatureCard } from '@/components/admin/features/editable-feature-card';
import { EventAssociationTable } from '@/components/admin/features/event-association-table';
import { FeatureSettings } from '@/components/admin/features/feature-settings';
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

export const Route = createFileRoute('/_protected/admin/features/$featureId')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/features');

    if (!hasAccess) {
      console.log('[FeatureDetailRoute] User does not have access to features');
      throw new Error('Unauthorized');
    }

    return {
      title: 'Feature Details',
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
    const featureId = params.featureId;
    const queryClient = context.queryClient;

    try {
      // Prefetch the feature data and prime the cache
      const feature = await queryClient.fetchQuery(featureDetailQueryOptions(featureId));

      return {
        featureId,
        title: feature?.title ? `Feature | ${feature.title}` : 'Feature Details',
      };
    } catch (error) {
      console.error('Error fetching feature data:', error);
      return {
        featureId,
        title: 'Feature Details',
      };
    }
  },
  component: FeatureDetailRoute,
});

function FeatureDetailRoute() {
  const { featureId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch feature details
  const { data: feature, isLoading: isLoadingFeature } = useSuspenseQuery(
    featureDetailQueryOptions(featureId)
  );

  // Fetch all events for the association table
  const { data: events, isLoading: isLoadingEvents } = useSuspenseQuery(allEventsQueryOptions());

  // Mutation for updating feature
  const updateFeatureMutation = useMutation({
    mutationFn: updateFeature,
    onSuccess: () => {
      // Invalidate feature detail query to refresh data
      queryClient.invalidateQueries({ queryKey: ['features', 'detail', featureId] });
      // Invalidate all features query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['features', 'all'] });
      toast.success('Feature updated successfully');
    },
    onError: (error) => {
      toast.error(`Error updating feature: ${error.message}`);
    },
  });

  // Mutation for deleting a feature
  const deleteFeatureMutation = useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => {
      // Invalidate features query to refresh data
      queryClient.invalidateQueries({ queryKey: ['features', 'all'] });
      toast.success('Feature deleted successfully');
      // Navigate back to the features list
      navigate({ to: '/admin/features' });
    },
    onError: (error) => {
      toast.error(`Error deleting feature: ${error.message}`);
    },
  });

  // Mutation for duplicating a feature
  const duplicateFeatureMutation = useMutation({
    mutationFn: duplicateFeature,
    onSuccess: (newFeature) => {
      // Invalidate features query to refresh data
      queryClient.invalidateQueries({ queryKey: ['features', 'all'] });
      toast.success('Feature duplicated successfully');
      // Navigate to the new feature's detail page
      navigate({ to: `/admin/features/${newFeature.id}` });
    },
    onError: (error) => {
      toast.error(`Error duplicating feature: ${error.message}`);
    },
  });

  // Handle feature update
  const handleFeatureUpdate = (updatedFeature: any) => {
    updateFeatureMutation.mutate({
      data: {
        featureId,
        ...updatedFeature,
      },
    });
  };

  // Handle delete feature
  const handleConfirmDelete = () => {
    console.log('Deleting feature with ID:', featureId);
    deleteFeatureMutation.mutate({ data: { featureId } });
  };

  // Handle duplicate feature
  const handleDuplicateFeature = () => {
    console.log('Duplicating feature with ID:', featureId);
    duplicateFeatureMutation.mutate({ data: { featureId } });
  };

  if (isLoadingFeature || isLoadingEvents) {
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
          <Button variant="outline" onClick={() => navigate({ to: '/admin/features' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Features
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDuplicateFeature}
              disabled={duplicateFeatureMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteFeatureMutation.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the feature and
                    remove it from any associated events.
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

        {/* Tabs for feature editing and settings */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="events">Associated Events</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="w-full bg-input p-8 rounded-lg">
              <div className="max-w-md mx-auto">
                <EditableFeatureCard feature={feature} onUpdate={handleFeatureUpdate} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <FeatureSettings feature={feature} onUpdate={handleFeatureUpdate} />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Associated Events</h2>
              <Suspense fallback={<div className="text-center py-4">Loading associations...</div>}>
                <EventAssociationTable featureId={featureId} events={events || []} />
              </Suspense>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
