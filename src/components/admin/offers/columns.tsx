import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteOffer, duplicateOffer } from '@/utils/all-offers';

import { ColumnHeader } from '@/components/column-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <ColumnHeader column={column} title="Title" />,
    enableSorting: true,
    cell: ({ row }) => {
      const title = row.getValue('title') as string;
      return <span>{title || 'Untitled Offer'}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <ColumnHeader column={column} title="Created At" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return format(new Date(date), 'd MMM, yyyy h:mm a');
    },
  },
  {
    accessorKey: 'expires_at',
    header: ({ column }) => <ColumnHeader column={column} title="Expires At" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('expires_at') as string | null;
      return date ? format(new Date(date), 'd MMM, yyyy h:mm a') : 'No expiration';
    },
  },
  {
    accessorKey: 'offer_type',
    header: ({ column }) => <ColumnHeader column={column} title="Offer Type" />,
    enableSorting: true,
    cell: ({ row }) => {
      const offerType = row.getValue('offer_type') as string;
      if (offerType === 'percentage_off') {
        return 'Percentage Off';
      } else if (offerType === 'amount_off') {
        return 'Fixed Amount Off';
      }
      return 'Unknown';
    },
  },
  {
    accessorKey: 'discount_value',
    header: ({ column }) => <ColumnHeader column={column} title="Discount Amount" />,
    enableSorting: true,
    cell: ({ row }) => {
      if (row.getValue('offer_type') === 'percentage_off') {
        return `${row.getValue('discount_value')}%`;
      } else {
        return `£${row.getValue('discount_value')}`;
      }
    },
  },
  {
    id: 'actions',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    cell: ({ row }) => {
      const offer = row.original;
      return <OfferActions offer={offer} />;
    },
  },
];

// Component for offer actions dropdown
function OfferActions({ offer }: { offer: any }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Mutation for deleting an offer
  const deleteOfferMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      // Invalidate offers query to refresh data
      queryClient.invalidateQueries({ queryKey: ['offers', 'all'] });
      toast.success('Offer deleted successfully');
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

  // Handle confirm delete
  const handleConfirmDelete = () => {
    console.log('Deleting offer with ID:', offer.id);
    deleteOfferMutation.mutate({ data: { offerId: offer.id } });
  };

  // Handle duplicate offer
  const handleDuplicateOffer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    console.log('Duplicating offer with ID:', offer.id);
    duplicateOfferMutation.mutate({ data: { offerId: offer.id } });
  };

  // State for the alert dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" data-interactive="true">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleDuplicateOffer}
            disabled={duplicateOfferMutation.isPending}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            disabled={deleteOfferMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer and remove it
              from any associated events.
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
    </>
  );
}
