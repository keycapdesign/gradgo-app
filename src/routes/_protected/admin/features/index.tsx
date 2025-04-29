import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { hasRouteAccess } from '@/utils/route-access';
import { allFeaturesQueryOptions, createFeature } from '@/utils/all-features';

import { ClientDataTable } from '@/components/admin/client-data-table';
import { columns } from '@/components/admin/features/columns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/admin/features/')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/features');

    if (!hasAccess) {
      console.log(
        '[FeaturesRoute] User does not have access to features, redirecting to unauthorized page'
      );
      throw redirect({
        to: '/unauthorized',
        search: {
          returnTo: '/admin', // Redirect to admin dashboard since user has roles
        },
      });
    }

    return {
      title: 'Features',
    };
  },
  // Remove the errorComponent as it's now handled by the parent route
  // The parent route will redirect to the /unauthorized page
  loader: () => {
    return {
      title: 'Features',
    };
  },
  component: FeaturesRoute,
});

function FeaturesRoute() {
  // Fetch all features for client-side table
  const { data: features, isLoading } = useSuspenseQuery(allFeaturesQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutation for creating a new feature
  const createFeatureMutation = useMutation({
    mutationFn: createFeature,
    onSuccess: (newFeature) => {
      // Invalidate features query to refresh data
      queryClient.invalidateQueries({ queryKey: ['features', 'all'] });
      toast.success('Feature created successfully');
      // Navigate to the new feature's detail page
      navigate({ to: `/admin/features/${newFeature.id}` });
    },
    onError: (error) => {
      toast.error(`Error creating feature: ${error.message}`);
    },
  });

  // Handle create feature button click
  const handleCreateFeature = () => {
    createFeatureMutation.mutate({});
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md border">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Features</h1>
        <Button onClick={handleCreateFeature} disabled={createFeatureMutation.isPending}>
          <Plus className="h-4 w-4" />
          Create Feature
        </Button>
      </div>
      <ClientDataTable
        columns={columns}
        data={features || []}
        defaultPageSize={25}
        getRowHref={(row) => `/admin/features/${row.id}`}
      />
    </div>
  );
}
