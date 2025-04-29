import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AppSettings } from './app-settings'
import { AccountSettings } from './account-settings'
import { UserManagement } from './user-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserRoles } from '@/hooks/use-user-roles'

export function SettingsTabs() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('app')

  // Use useEffect to access window object only on client side
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [])
  const { hasRole } = useUserRoles()

  // Only super_admin and admin can see the user management tab
  const canManageUsers = hasRole('super_admin') || hasRole('admin')

  // Update active tab when URL search params change
  useEffect(() => {
    const handleRouteChange = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) {
        setActiveTab(tab)
      }
    }

    // Listen for route changes
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange)

      return () => {
        window.removeEventListener('popstate', handleRouteChange)
      }
    }
  }, [])

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Update URL without full navigation - only on client side
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (value === 'app') {
        url.searchParams.delete('tab')
      } else {
        url.searchParams.set('tab', value)
      }
      window.history.pushState({}, '', url.toString())
    }
  }

  return (
    <Tabs defaultValue="app" value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="app">App Settings</TabsTrigger>
        <TabsTrigger value="account">Account Settings</TabsTrigger>
        {canManageUsers && <TabsTrigger value="users">User Management</TabsTrigger>}
      </TabsList>
      <TabsContent value="app" className="mt-6">
        <AppSettings />
      </TabsContent>
      <TabsContent value="account" className="mt-6">
        <AccountSettings />
      </TabsContent>
      {canManageUsers && (
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      )}
    </Tabs>
  )
}
