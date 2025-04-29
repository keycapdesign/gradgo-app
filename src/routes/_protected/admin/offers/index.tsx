import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { hasRouteAccess } from '@/utils/route-access';
import { allOffersQueryOptions, createOffer } from '@/utils/all-offers';

import { ClientDataTable } from '@/components/admin/client-data-table';
import { columns } from '@/components/admin/offers/columns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/admin/offers/')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/offers');

    if (!hasAccess) {
      console.log(
        '[OffersRoute] User does not have access to offers, redirecting to unauthorized page'
      );
      throw redirect({
        to: '/unauthorized',
        search: {
          returnTo: '/admin', // Redirect to admin dashboard since user has roles
        },
      });
    }

    return {
      title: 'Offers',
    };
  },
  // Remove the errorComponent as it's now handled by the parent route
  // The parent route will redirect to the /unauthorized page
  loader: () => {
    return {
      title: 'Offers',
    };
  },
  component: OffersRoute,
});

function OffersRoute() {
  // Fetch all offers for client-side table
  const { data: offers, isLoading } = useSuspenseQuery(allOffersQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Mutation for creating a new offer
  const createOfferMutation = useMutation({
    mutationFn: createOffer,
    onSuccess: (newOffer) => {
      // Invalidate offers query to refresh data
      queryClient.invalidateQueries({ queryKey: ['offers', 'all'] });
      toast.success('Offer created successfully');
      // Navigate to the new offer's detail page
      navigate({ to: `/admin/offers/${newOffer.id}` });
    },
    onError: (error) => {
      toast.error(`Error creating offer: ${error.message}`);
    },
  });

  // Handle create offer button click
  const handleCreateOffer = () => {
    createOfferMutation.mutate({});
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
        <h1 className="text-2xl font-bold">Offers</h1>
        <Button onClick={handleCreateOffer} disabled={createOfferMutation.isPending}>
          <Plus className="h-4 w-4" />
          Create Offer
        </Button>
      </div>
      <ClientDataTable
        columns={columns}
        data={offers || []}
        defaultPageSize={25}
        getRowHref={(row) => `/admin/offers/${row.id}`}
      />
    </div>
  );
}
