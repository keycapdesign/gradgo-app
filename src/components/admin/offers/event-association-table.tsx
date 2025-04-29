import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { offerAssociationsQueryOptions, toggleOfferAssociation } from '@/utils/associations';

import { ClientDataTable } from '@/components/admin/client-data-table';
import { ColumnHeader } from '@/components/column-header';
import { Checkbox } from '@/components/ui/checkbox';

interface Event {
  id: number;
  name: string;
  datetime: string | null;
  organization: {
    name: string | null;
  } | null;
}

interface EventAssociationTableProps {
  offerId: string;
  events: Event[];
}

export function EventAssociationTable({ offerId, events }: EventAssociationTableProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const queryClient = useQueryClient();

  // Fetch associations using TanStack Query
  const { data: associatedEventIds = [] } = useSuspenseQuery(
    offerAssociationsQueryOptions(offerId)
  );

  // Update filtered events when events prop changes
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  // Mutation for toggling association
  const toggleAssociationMutation = useMutation({
    mutationFn: ({ eventId, isAssociated }: { eventId: number; isAssociated: boolean }) =>
      toggleOfferAssociation({ offerId, eventId, isAssociated }),
    onSuccess: (result) => {
      const { eventId, isAssociated } = result;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['offer', offerId, 'associations'] });
      queryClient.invalidateQueries({ queryKey: ['event', String(eventId), 'offers'] });

      toast.success(isAssociated ? 'Offer associated with event' : 'Offer removed from event');
    },
    onError: (error: any) => {
      toast.error(`Error updating association: ${error.message}`);
    },
  });

  // Handle checkbox change
  const handleCheckboxChange = (eventId: number, checked: boolean) => {
    toggleAssociationMutation.mutate({ eventId, isAssociated: checked });
  };

  // Define columns for the data table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <ColumnHeader column={column} title="Event Name" />,
      enableSorting: true,
    },
    {
      accessorKey: 'organization.name',
      header: ({ column }) => <ColumnHeader column={column} title="University" />,
      enableSorting: true,
      cell: ({ row }) => {
        const organization = row.original.organization;
        return organization?.name || '';
      },
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
