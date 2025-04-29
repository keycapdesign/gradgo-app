import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { activeEventsQueryOptions } from '@/utils/all-events';

import { AppSidebar } from '@/components/admin/app-sidebar';
import { SiteHeader } from '@/components/admin/header';
import { MfaGuard } from '@/components/auth/mfa/mfa-guard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const Route = createFileRoute('/_protected/admin')({
  head: () => ({
    meta: [
      {
        name: 'title',
        content: 'Admin Dashboard | GradGo',
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    console.log('[AdminRoute] Checking user authentication and roles');

    // Get user roles from context
    const userRoles = context.userRoles || [];
    console.log('[AdminRoute] User roles:', userRoles);

    // Check if the user has any role (staff user)
    if (userRoles.length === 0) {
      console.log('[AdminRoute] User has no roles, redirecting to unauthorized page');
      throw redirect({
        to: '/unauthorized',
        search: {
          returnTo: '/',
        },
      });
    }

    // Check if the user is in returns mode (has the limited role)
    const hasLimitedRole = userRoles.includes('limited');

    if (hasLimitedRole) {
      console.log('[AdminRoute] User has limited role, redirecting to kiosk');
      throw redirect({ to: '/kiosk/returns' });
    }

    // Return auth status to be used in loaderDeps
    return {
      isAuthorized: true,
    };
  },

  // Set shouldReload to false to prevent the route from reloading when it's not active
  // This helps ensure the error state persists
  shouldReload: false,

  loader: async ({ context }) => {
    try {
      // Only attempt to load data if the user is authorized
      // This is a safeguard in case beforeLoad doesn't catch unauthorized access
      if (!context.userRoles || context.userRoles.length === 0) {
        console.log('[AdminRoute] No roles in loader, throwing unauthorized error');
        throw new Error('Unauthorized');
      }

      const events = await context.queryClient.ensureQueryData(activeEventsQueryOptions());

      return {
        events,
        title: 'Dashboard',
      };
    } catch (error) {
      console.error('[AdminRoute] Error in loader:', error);
      // Throw the error to be handled by the onError handler
      throw error;
    }
  },

  component: AppLayoutComponent,
});

function AppLayoutComponent() {
  return (
    <MfaGuard>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset data-sidebar-inset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MfaGuard>
  );
}
