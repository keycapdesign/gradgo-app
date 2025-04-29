import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Database } from '@/types/database.types';

import { ColumnHeader } from '@/components/column-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Contact = Database['public']['Views']['contacts_with_recent_booking']['Row'];

export const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: 'contact_created_at',
    header: ({ column }) => {
      return <ColumnHeader title="Created At" column={column} />;
    },
    cell: ({ row }) => {
      const date = row.original.contact_created_at
        ? new Date(row.original.contact_created_at)
        : null;
      return date ? date.toLocaleString() : '';
    },
    enableHiding: false,
  },
  {
    accessorKey: 'contact_id',
    header: 'Contact ID',
    cell: ({ row }) => {
      return row.original.contact_id!.toString();
    },
  },
  {
    accessorKey: 'user_id',
    header: 'User ID',
    cell: ({ row }) => {
      return row.original.user_id!;
    },
  },
  {
    accessorKey: 'full_name',
    header: ({ column }) => {
      return <ColumnHeader title="Name" column={column} />;
    },
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Phone',
    accessorKey: 'phone',
  },
  {
    accessorKey: 'order_type',
    header: 'Booking Type',
  },
  {
    accessorKey: 'event_name',
    header: ({ column }) => {
      return <ColumnHeader title="Event" column={column} />;
    },
  },
  {
    header: 'Photo Start Time',
    accessorKey: 'photo_start_time',
  },
  {
    header: 'Photo End Time',
    accessorKey: 'photo_end_time',
  },
  {
    accessorKey: 'qr_code_path',
    header: 'QR Code Path',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const contact = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(contact.contact_id!.toString())}
            >
              Copy Contact ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View contact details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
  },
];
