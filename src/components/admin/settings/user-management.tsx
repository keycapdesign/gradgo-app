import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createUserColumns, UserData } from './user-columns'
import { createClient } from '@/utils/supabase/client'
import { ClientDataTable } from '@/components/admin/client-data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserRoles } from '@/hooks/use-user-roles'
import { createStaffUserFn, removeStaffUserFn } from '@/utils/staff-users'

export function UserManagement() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'customer_service',
  })

  const queryClient = useQueryClient()
  const { hasRole } = useUserRoles()
  const isSuperAdmin = hasRole('super_admin')

  // Fetch staff users
  const { data: users = [] } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_user_profiles')
        .select('*')

      if (error) {
        throw error
      }

      // Transform the data to match UserData type
      return data.map((user: any) => ({
        ...user,
        roles: user.role_name ? [user.role_name] : [],
      })) as UserData[]
    },
  })

  // Create staff user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      try {
        // Call the server function
        return await createStaffUserFn.call({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
        })
      } catch (error: any) {
        console.error('Error creating user:', error)
        throw new Error(error.message || 'Failed to create user')
      }
    },
    onSuccess: () => {
      toast.success('User created successfully')
      setIsAddUserDialogOpen(false)
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'customer_service',
      })
      queryClient.invalidateQueries({ queryKey: ['staff-users'] })
    },
    onError: (error) => {
      toast.error(`Error creating user: ${error.message}`)
    },
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string; oldRole?: string }) => {
      const supabase = createClient()

      // Get the role ID from the roles table
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', newRole)
        .single()

      if (roleError) {
        throw roleError
      }

      // Update the primary role in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role_id: roleData.id })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      return { userId, newRole }
    },
    onSuccess: () => {
      toast.success('User role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['staff-users'] })
    },
    onError: (error) => {
      toast.error(`Error updating user role: ${error.message}`)
    },
  })

  // Disable/Enable user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const supabase = createClient()

      // Since staff_user_profiles is a view, we need to update the underlying user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { userId, isActive: !isActive }
    },
    onSuccess: (data) => {
      toast.success(`User ${data.isActive ? 'enabled' : 'disabled'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['staff-users'] })
    },
    onError: (error) => {
      toast.error(`Error updating user status: ${error.message}`)
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deleting user with ID:', userId)
      try {
        // Call the server function
        return await removeStaffUserFn.call({ user_id: userId })
      } catch (error: any) {
        console.error('Error in deleteUserMutation:', error)
        throw new Error(error.message || 'Failed to delete user')
      }
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedUserId(null)
      queryClient.invalidateQueries({ queryKey: ['staff-users'] })
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${error.message}`)
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        throw error
      }

      return { email }
    },
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error) => {
      toast.error(`Error sending password reset: ${error.message}`)
    },
  })

  // Handle role change
  const handleRoleChange = (userId: string, newRole: string, oldRole: string) => {
    updateRoleMutation.mutate({ userId, newRole, oldRole })
  }

  // Handle user actions
  const handleDisableUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      toggleUserStatusMutation.mutate({ userId, isActive: !!user.is_active })
    }
  }

  const handleDeleteUser = (userId: string) => {
    setSelectedUserId(userId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (selectedUserId) {
      deleteUserMutation.mutate(selectedUserId)
    }
  }

  const handleResetPassword = (_userId: string, email: string) => {
    resetPasswordMutation.mutate({ email })
  }

  // Create columns with handlers
  const columns = createUserColumns(
    handleRoleChange,
    {
      onDisableUser: handleDisableUser,
      onDeleteUser: handleDeleteUser,
      onResetPassword: handleResetPassword,
    }
  )

  // Handle add user form submission
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    createUserMutation.mutate(newUserData)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staff Users</CardTitle>
            <CardDescription>
              Manage staff users and their roles
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <ClientDataTable
            columns={columns}
            data={users}
            defaultPageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <AlertDialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Staff User</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new staff user account. The user will receive an invitation email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="ceremony_manager">Ceremony Manager</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
