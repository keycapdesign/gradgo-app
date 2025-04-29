import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { featureAssociationsQueryOptions, toggleFeatureAssociation } from '@/utils/associations';
import type { Database } from '@/types/database.types';

import { ClientDataTable } from '@/components/admin/client-data-table';
import { ColumnHeader } from '@/components/column-header';
import { Checkbox } from '@/components/ui/checkbox';

// Use the generated type for events
export type AdminEvent = Database['public']['Tables']['events']['Row'] & {
  organization?: { name: string | null } | null;
};

interface EventAssociationTableProps {
  featureId: string;
  events: AdminEvent[];
}

export function EventAssociationTable({ featureId, events }: EventAssociationTableProps) {
  const [filteredEvents, setFilteredEvents] = useState<AdminEvent[]>(events);
  const queryClient = useQueryClient();

  // Fetch associations using TanStack Query
  const { data: associatedEventIds = [] } = useSuspenseQuery(
    featureAssociationsQueryOptions(featureId)
  );

  // Update filtered events when events prop changes
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  // Mutation for toggling association
  const toggleAssociationMutation = useMutation({
    mutationFn: ({ eventId, isAssociated }: { eventId: number; isAssociated: boolean }) =>
      toggleFeatureAssociation({ featureId, eventId, isAssociated }),
    onSuccess: (result) => {
      const { eventId, isAssociated } = result;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['feature', featureId, 'associations'] });
      queryClient.invalidateQueries({ queryKey: ['event', String(eventId), 'features'] });

      toast.success(isAssociated ? 'Feature associated with event' : 'Feature removed from event');
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Error updating association: ${(error as { message: string }).message}`);
      } else {
        toast.error('Error updating association');
      }
    },
  });

  // Handle checkbox change
  const handleCheckboxChange = (eventId: number, checked: boolean) => {
    toggleAssociationMutation.mutate({ eventId, isAssociated: checked });
  };

  // Define columns with type safety
  const columns: ColumnDef<AdminEvent>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <ColumnHeader column={column} title="Event Name" />,
      enableSorting: true,
      cell: ({ row }) => row.getValue('name'),
    },
    {
      accessorKey: 'organization.name',
      header: ({ column }) => <ColumnHeader column={column} title="University" />,
      enableSorting: true,
      cell: ({ row }) => row.original.organization?.name || '',
    },
    {
      accessorKey: 'datetime',
      header: ({ column }) => <ColumnHeader column={column} title="Date" />,
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.getValue('datetime') as string | null;
        return date ? format(new Date(date), 'd MMM yyyy, h:mm a') : '-';
      },
    },
    {
      id: 'active',
      header: ({ column }) => <ColumnHeader column={column} title="Active" />,
      cell: ({ row }) => {
        const event = row.original;
        return (
          <div className="flex justify-center" data-interactive="true">
            <Checkbox
              checked={associatedEventIds.includes(event.id)}
              onCheckedChange={(checked) => handleCheckboxChange(event.id, checked === true)}
              disabled={toggleAssociationMutation.isPending}
            />
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <div className="space-y-4">
      <ClientDataTable
        columns={columns}
        data={filteredEvents}
        getRowHref={(row) => `/admin/events/${row.id}`}
        defaultPageSize={10}
      />
    </div>
  );
}
