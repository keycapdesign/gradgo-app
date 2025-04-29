import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { ColumnHeader } from '@/components/column-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Define the user type
export type UserData = {
  id: string
  email: string
  first_name: string | null
  surname: string | null
  full_name: string | null
  created_at: string
  is_active: boolean | null
  roles: string[]
  role_id: string | null
  role_name: string | null
}

// Define the role options
const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'ceremony_manager', label: 'Ceremony Manager' },
  { value: 'customer_service', label: 'Customer Service' },
]

// Function to handle role change
type RoleChangeHandler = (userId: string, newRole: string, oldRole: string) => void

// Function to handle user actions
type UserActionHandler = {
  onDisableUser: (userId: string) => void
  onDeleteUser: (userId: string) => void
  onResetPassword: (userId: string, email: string) => void
}

// Create the columns definition
export const createUserColumns = (
  onRoleChange: RoleChangeHandler,
  actionHandlers: UserActionHandler
): ColumnDef<UserData>[] => [
  {
    accessorKey: 'full_name',
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const fullName = row.getValue('full_name') as string
      const firstName = row.original.first_name || ''
      const surname = row.original.surname || ''

      return fullName || `${firstName} ${surname}`.trim() || 'N/A'
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <ColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <ColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return date ? format(new Date(date), 'd MMM, yyyy') : 'N/A'
    },
  },
  {
    accessorKey: 'is_active',
    header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean

      return isActive ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Inactive
        </Badge>
      )
    },
  },
  {
    accessorKey: 'role_name',
    header: ({ column }) => <ColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const userId = row.original.id
      const roles = row.original.roles || []
      const roleName = row.original.role_name || ''

      // Get the role ID from the user data or fallback to the first role in the array
      // Convert role name to role ID for the select value
      const roleNameToId = {
        'Super Admin': 'super_admin',
        'Admin': 'admin',
        'Ceremony Manager': 'ceremony_manager',
        'Customer Service': 'customer_service'
      }

      const primaryRole = roleNameToId[roleName] || (roles.length > 0 ? roles[0] : 'customer_service')

      return (
        <Select
          value={primaryRole}
          onValueChange={(newRole) => onRoleChange(userId, newRole, primaryRole)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original

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
            <DropdownMenuItem onClick={() => actionHandlers.onResetPassword(user.id, user.email)}>
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actionHandlers.onDisableUser(user.id)}
              className="text-amber-600"
            >
              {user.is_active ? 'Disable User' : 'Enable User'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actionHandlers.onDeleteUser(user.id)}
              className="text-red-600"
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
