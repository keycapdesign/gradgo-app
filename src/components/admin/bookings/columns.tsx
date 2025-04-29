import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { LogIn, LogOut, MoreHorizontal, RefreshCw, Undo } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { useOfflineOperations } from '@/hooks/useOfflineOperations';

import { PendingStatusBadge } from '@/components/admin/pending-status-badge';
import { ColumnHeader } from '@/components/column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Booking and Ceremony types from Supabase
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Ceremony = Database['public']['Tables']['ceremonies']['Row'];

// Extend Booking for UI optimistic fields
export type OptimisticBooking = Booking & {
  pendingCheckout?: boolean;
  pendingCheckin?: boolean;
  pendingUndoCheckout?: boolean;
  pendingUndoCheckin?: boolean;
  pendingGownChange?: boolean;
};

// Type for pendingOperation
export type PendingOperation =
  | {
      type: 'CHECK_OUT_GOWN' | 'CHECK_IN_GOWN' | 'UNDO_CHECK_OUT' | 'UNDO_CHECK_IN' | 'CHANGE_GOWN';
      description?: string;
    }
  | { type: 'PENDING_OPERATION'; description: string };

export const columns: ColumnDef<OptimisticBooking>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <ColumnHeader column={column} title="ID" />,
    enableSorting: true,
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => <ColumnHeader column={column} title="Student Name" />,
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    enableSorting: true,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <ColumnHeader column={column} title="Phone" />,
    enableSorting: true,
  },
  {
    accessorKey: 'ceremony',
    header: ({ column }) => <ColumnHeader column={column} title="Ceremony" />,
    cell: ({ row }) => {
      const ceremony = row.getValue('ceremony') as Ceremony | null;
      return ceremony?.name || '';
    },
    enableSorting: true,
  },
  {
    accessorKey: 'order_type',
    header: ({ column }) => <ColumnHeader column={column} title="Order Type" />,
    enableSorting: true,
    enableColumnFilter: true,
    cell: ({ row }) => {
      const orderType = row.getValue('order_type') as string;
      return orderType ? <Badge variant="outline">{orderType}</Badge> : null;
    },
  },
  {
    accessorKey: 'award',
    header: ({ column }) => <ColumnHeader column={column} title="Award" />,
    enableSorting: true,
    cell: ({ row }) => {
      const award = row.getValue('award') as string;
      return award ? <Badge variant="secondary">{award}</Badge> : null;
    },
  },
  {
    accessorKey: 'booking_status',
    header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    enableSorting: true,
    enableColumnFilter: true,
    enableHiding: false,
    cell: ({ row }) => {
      const status = row.getValue('booking_status') as string;
      if (!status) return null;
      const booking = row.original as OptimisticBooking;
      const orderType = row.getValue('order_type') as string;
      // Pass orderType to StatusCell
      return <StatusCell booking={booking} status={status} orderType={orderType} />;
    },
  },
  {
    accessorKey: 'check_out_time',
    header: ({ column }) => <ColumnHeader column={column} title="Check Out" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('check_out_time') as string;
      if (!date) return null;
      return format(new Date(date), 'PPP p');
    },
  },
  {
    accessorKey: 'check_in_time',
    header: ({ column }) => <ColumnHeader column={column} title="Check In" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('check_in_time') as string;
      if (!date) return null;
      return format(new Date(date), 'PPP p');
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    cell: ({ row }) => {
      const booking = row.original as OptimisticBooking;
      const status = row.getValue('booking_status') as string;
      const orderType = row.getValue('order_type') as string;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Show different actions based on booking status */}
            {status === 'awaiting_pickup' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  document.dispatchEvent(new CustomEvent('checkout-gown', { detail: { booking } }));
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Check Out Gown
              </DropdownMenuItem>
            )}

            {(status === 'collected' || status === 'late') && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    document.dispatchEvent(new CustomEvent('change-gown', { detail: { booking } }));
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Change Gown
                </DropdownMenuItem>
                {orderType !== 'PURCHASE' && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        document.dispatchEvent(
                          new CustomEvent('checkin-gown', { detail: { booking } })
                        );
                      }}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Check In Gown
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        document.dispatchEvent(
                          new CustomEvent('undo-checkout', { detail: { booking } })
                        );
                      }}
                    >
                      <Undo className="h-4 w-4 mr-2" />
                      Undo Check Out
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}

            {status === 'returned' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  document.dispatchEvent(new CustomEvent('undo-checkin', { detail: { booking } }));
                }}
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo Check In
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(booking.id.toString());
              }}
            >
              Copy Booking ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function StatusCell({
  booking,
  status,
  orderType,
}: {
  booking: OptimisticBooking;
  status: string;
  orderType?: string;
}) {
  const { pendingOperation, error }: { pendingOperation: PendingOperation | null; error: unknown } =
    useOfflineOperations(booking.id);
  console.log('[OFFLINE_DEBUG] StatusCell hook output:', {
    pendingOperation,
    error,
    bookingId: booking.id,
  });

  // Compute optimistic status
  let optimisticStatus = status;
  if (pendingOperation) {
    if (pendingOperation.type === 'CHECK_OUT_GOWN') optimisticStatus = 'collected';
    else if (pendingOperation.type === 'CHECK_IN_GOWN') optimisticStatus = 'returned';
    else if (pendingOperation.type === 'UNDO_CHECK_OUT') optimisticStatus = 'awaiting_pickup';
    else if (pendingOperation.type === 'UNDO_CHECK_IN') optimisticStatus = 'collected';
    else if (pendingOperation.type === 'CHANGE_GOWN') optimisticStatus = 'collected';
  } else if (booking.pendingCheckout) {
    optimisticStatus = 'collected';
  } else if (booking.pendingCheckin) {
    optimisticStatus = 'returned';
  } else if (booking.pendingUndoCheckout) {
    optimisticStatus = 'awaiting_pickup';
  } else if (booking.pendingUndoCheckin) {
    optimisticStatus = 'collected';
  } else if (booking.pendingGownChange) {
    optimisticStatus = 'collected';
  }

  // Handle purchase orders
  if (optimisticStatus === 'collected' && orderType === 'PURCHASE') {
    return <Badge variant="default">PURCHASE</Badge>;
  }

  // Always pass the optimistic status to the badge, and error if present
  return (
    <PendingStatusBadge
      status={optimisticStatus}
      pendingOperation={
        pendingOperation
          ? {
              type: pendingOperation.type,
              description: pendingOperation.description ?? '',
            }
          : booking.pendingCheckout ||
              booking.pendingCheckin ||
              booking.pendingUndoCheckout ||
              booking.pendingUndoCheckin ||
              booking.pendingGownChange
            ? {
                type: 'PENDING_OPERATION',
                description:
                  'This booking has a pending operation that will be applied when back online.',
              }
            : null
      }
      bookingId={booking.id}
      error={typeof error === 'string' ? error : error ? String(error) : null}
    />
  );
}
