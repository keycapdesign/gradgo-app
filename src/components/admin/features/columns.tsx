import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { deleteFeature, duplicateFeature } from '@/utils/all-features';
import type { Database } from '@/types/database.types';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Use the generated type for features
export type Feature = Database['public']['Tables']['features']['Row'];

export const columns: ColumnDef<Feature>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <ColumnHeader column={column} title="Title" />,
    enableSorting: true,
    cell: ({ row }) => {
      const title = row.getValue('title') as string;
      return <span>{title || 'Untitled Feature'}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <ColumnHeader column={column} title="Created At" />,
    enableSorting: true,
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return format(new Date(date), 'd MMM, yyyy H:mm a');
    },
  },
  {
    accessorKey: 'is_default',
    header: ({ column }) => <ColumnHeader column={column} title="Show by Default" />,
    enableSorting: true,
    cell: ({ row }) => {
      const isDefault = row.getValue('is_default') as boolean;
      const featureId = row.original.id;

      // Create a component with its own mutation
      return (
        <DefaultCheckbox isDefault={isDefault} featureId={featureId} data-interactive="true" />
      );
    },
  },
  {
    id: 'actions',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    cell: ({ row }) => {
      const feature = row.original;
      return <FeatureActions feature={feature} />;
    },
  },
];

// Component for handling the is_default checkbox
function DefaultCheckbox({
  isDefault,
  featureId,
  ...props
}: {
  isDefault: boolean;
  featureId: string;
  [key: string]: any;
}) {
  const queryClient = useQueryClient();

  // Mutation for updating the is_default status
  const updateDefaultMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const supabase = createClient();

      // Update this feature - allow multiple defaults
      const { error } = await supabase
        .from('features')
        .update({ is_default: newValue })
        .eq('id', featureId);

      if (error) throw error;

      return newValue;
    },
    onSuccess: (newValue) => {
      // Invalidate features queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success(`Feature ${newValue ? 'added to' : 'removed from'} default features`);
    },
    onError: (error: any) => {
      toast.error(`Error updating feature default status: ${error.message}`);
    },
  });

  const handleChange = (checked: boolean) => {
    updateDefaultMutation.mutate(checked);
  };

  return (
    <Checkbox
      checked={isDefault}
      onCheckedChange={handleChange}
      disabled={updateDefaultMutation.isPending}
      {...props}
    />
  );
}

// Component for feature actions dropdown
function FeatureActions({ feature }: { feature: Feature }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Mutation for deleting a feature
  const deleteFeatureMutation = useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => {
      // Invalidate features query to refresh data
      queryClient.invalidateQueries({ queryKey: ['features', 'all'] });
      toast.success('Feature deleted successfully');
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

  // Handle confirm delete
  const handleConfirmDelete = () => {
    console.log('Deleting feature with ID:', feature.id);
    deleteFeatureMutation.mutate({ data: { featureId: feature.id } });
  };

  // Handle duplicate feature
  const handleDuplicateFeature = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    console.log('Duplicating feature with ID:', feature.id);
    duplicateFeatureMutation.mutate({ data: { featureId: feature.id } });
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
            onClick={handleDuplicateFeature}
            disabled={duplicateFeatureMutation.isPending}
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
            disabled={deleteFeatureMutation.isPending}
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
              This action cannot be undone. This will permanently delete the feature and remove it
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
