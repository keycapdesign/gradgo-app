import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { toggleEventActiveStatus } from '@/utils/events';
import type { Database } from '@/types/database.types';

import { ColumnHeader } from '@/components/column-header';
import { Checkbox } from '@/components/ui/checkbox';

export type Event = Database['public']['Tables']['events']['Row'];

// Extended Event type for admin table with organization relation
export type AdminEvent = Event & {
  organization?: Database['public']['Tables']['organizations']['Row'] | null;
};

// Component for the is_active checkbox with its own mutation
function ActiveStatusCheckbox({ eventId, isActive }: { eventId: number; isActive: boolean }) {
  const queryClient = useQueryClient();

  // Mutation for toggling active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ eventId, isActive }: { eventId: number; isActive: boolean }) => {
      return toggleEventActiveStatus({ data: { eventId, isActive } });
    },
    onMutate: async ({ isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events', 'all'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['events', 'all']) as
        | Database['public']['Tables']['events']['Row'][]
        | undefined;

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['events', 'all'],
        (old: Database['public']['Tables']['events']['Row'][] | undefined) => {
          return old?.map((event) => {
            if (event.id === eventId) {
              return { ...event, is_active: isActive };
            }
            return event;
          });
        }
      );

      return { previousEvents };
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['events', 'all'] });
      toast.success(`Event ${isActive ? 'deactivated' : 'activated'} successfully`);
    },
    onError: (error, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['events', 'all'], context?.previousEvents);
      toast.error(`Failed to update event status: ${error.message}`);
    },
  });

  const handleChange = (checked: boolean) => {
    toggleActiveMutation.mutate({ eventId, isActive: checked });
  };

  return (
    <div className="flex justify-center" data-interactive="true">
      <Checkbox
        checked={isActive}
        onCheckedChange={handleChange}
        disabled={toggleActiveMutation.isPending}
      />
    </div>
  );
}

export const columns: ColumnDef<AdminEvent>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    enableSorting: true,
  },
  {
    accessorKey: 'datetime',
    header: ({ column }) => <ColumnHeader column={column} title="Date" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('datetime') as string;
      return format(new Date(date), 'd MMM, yyyy h:mm a');
    },
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
    accessorKey: 'is_active',
    header: ({ column }) => <ColumnHeader column={column} title="Is Active" />,
    enableSorting: true,
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      const eventId = row.original.id;
      return <ActiveStatusCheckbox eventId={eventId} isActive={isActive} />;
    },
  },
];
