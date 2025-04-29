import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { allEventsQueryOptions } from '@/utils/all-events';
import { createRowHrefGetter } from '@/utils/navigation';
import { hasRouteAccess } from '@/utils/route-access';

import { ClientDataTable } from '@/components/admin/client-data-table';
import { columns } from '@/components/admin/events/columns';
import { Skeleton } from '@/components/ui/skeleton';
import { UnauthorizedError } from '@/components/unauthorized';

export const Route = createFileRoute('/_protected/admin/events/')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/events');

    if (!hasAccess) {
      console.log('[EventsRoute] User does not have access to events');
      throw new Error('Unauthorized');
    }

    return {
      title: 'Events',
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
  loader: () => {
    return {
      title: 'Events',
    };
  },
  component: EventsRoute,
});

function EventsRoute() {
  // Fetch all events for client-side table
  const { data: events, isLoading } = useSuspenseQuery(allEventsQueryOptions());

  // Create a function to generate URLs for event detail pages
  const getEventDetailUrl = createRowHrefGetter('events');

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
      <ClientDataTable
        columns={columns}
        data={events || []}
        getRowHref={getEventDetailUrl}
        defaultPageSize={25}
      />
    </div>
  );
}
