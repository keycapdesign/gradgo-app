import { createFileRoute, Outlet } from '@tanstack/react-router'
import { hasRouteAccess } from '@/utils/route-access'
import { UnauthorizedError } from '@/components/unauthorized'

export const Route = createFileRoute('/_protected/admin/settings')({
  component: SettingsLayout,
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || []
    const hasAccess = hasRouteAccess(userRoles, '/admin/settings')

    if (!hasAccess) {
      console.log('[SettingsRoute] User does not have access to settings')
      throw new Error('Unauthorized')
    }

    return {
      title: 'Settings'
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Unauthorized') {
      return (
        <div className="min-h-screen bg-background">
          <UnauthorizedError />
        </div>
      )
    }
    throw error
  },
})

function SettingsLayout() {
  return (
    <div className="container mx-auto py-10">
      <Outlet />
    </div>
  )
}
