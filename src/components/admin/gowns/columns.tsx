import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { Database } from "@/types/database.types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ColumnHeader } from "@/components/column-header"

export type Gown = Database['public']['Views']['gowns_with_latest_booking']['Row']

export const columns: ColumnDef<Gown>[] = [
    {
        accessorKey: 'ean',
        header: ({ column }) => {
            return <ColumnHeader title="Gown EAN" column={column} />
        },
        cell: ({ row }) => {
            return row.original.ean
        },
    },
    {
        accessorKey: 'rfid',
        header: 'RFID',
        cell: ({ row }) => {
            return row.original.rfid
        }
    },
    {
        accessorKey: 'in_stock',
        header: 'Gown Status',
        cell: ({ row }) => {
            return row.original.in_stock ? 'In Stock' : 'Checked Out'
        }
    },
    {
        accessorKey: 'check_out_time',
        header: ({ column }) => {
            return <ColumnHeader title="Checked Out At" column={column} />
        },
        cell: ({ row }) => {
            const date = row.original.check_out_time ? new Date(row.original.check_out_time) : null
            return date ? format(date, 'd MMM, h:mm a') : ''
        }
    },
    {
        accessorKey: 'check_in_time',
        header: ({ column }) => {
            return <ColumnHeader title="Checked In At" column={column} />
        },
        cell: ({ row }) => {
            const date = row.original.check_in_time ? new Date(row.original.check_in_time) : null
            return date ? format(date, 'd MMM, h:mm a') : ''
        }
    },
    {
        accessorKey: 'full_name',
        header: ({ column }) => {
            return <ColumnHeader title="Last Booking Name" column={column} />
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const gown = row.original
     
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
                            onClick={() => navigator.clipboard.writeText(gown.ean!)}
                        >
                            Copy EAN
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View gown details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
        enableHiding: false,
    },
]
