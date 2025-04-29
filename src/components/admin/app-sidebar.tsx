import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useMatches, useNavigate, useRouter } from '@tanstack/react-router';
import {
  BarChart,
  Calendar,
  ChevronUp,
  Contact2,
  GraduationCap,
  Home,
  Image,
  ListStart,
  Loader2,
  Star,
  Tag,
  User2,
} from 'lucide-react';
import { EventSwitcher } from './event-switcher';
import { GalleryModeAlert } from './gallery-mode-alert';
import { ReturnsModeAlert } from './returns-mode-alert';
import { useReturnsMode } from '@/hooks/use-returns-mode';
import { useUserRoles } from '@/hooks/use-user-roles';
import { Route as AdminRoute } from '@/routes/_protected/admin/route';
import { activeEventsQueryOptions } from '@/utils/all-events';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Using a simple try-catch instead of ErrorBoundary

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Define the type for menu items
type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType;
  requiredRoles: string[];
};

// Define all possible menu items
const allItems: MenuItem[] = [
  {
    title: 'Event Manager',
    url: '/admin/event-manager',
    icon: Home,
    requiredRoles: [], // Accessible by all roles
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart,
    requiredRoles: ['admin', 'super_admin'], // Only admins and super admins
  },
  {
    title: 'Contacts',
    url: '/admin/contacts',
    icon: Contact2,
    requiredRoles: [], // Accessible by all roles
  },
  {
    title: 'Events',
    url: '/admin/events',
    icon: Calendar,
    requiredRoles: ['ceremony_manager'], // Admins, super admins, and ceremony managers
  },
  {
    title: 'Gowns',
    url: '/admin/gowns',
    icon: GraduationCap,
    requiredRoles: [], // Accessible by all roles
  },
  {
    title: 'Offers',
    url: '/admin/offers',
    icon: Tag,
    requiredRoles: ['ceremony_manager'], // Admins, super admins, and ceremony managers
  },
  {
    title: 'Features',
    url: '/admin/features',
    icon: Star,
    requiredRoles: ['ceremony_manager'], // Admins, super admins, and ceremony managers
  },
  {
    title: 'Stage Queue',
    url: '/admin/stage-queue',
    icon: ListStart,
    requiredRoles: [], // Accessible by all roles
  },
];

// Fallback component for when events query fails
function EventSwitcherFallback() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="w-full justify-between bg-background/80 text-destructive"
      onClick={() => {
        // Use router.invalidate() to refresh the route data
        router.invalidate();
      }}
    >
      <span className="truncate flex-1 text-left">Failed to load events. Click to retry.</span>
    </Button>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  // Get events from the route loader data, with a fallback for when loader data is not available
  const loaderData = AdminRoute.useLoaderData();
  const events = loaderData?.events || [];

  // Use the query to check for loading/error states
  const { isLoading: isEventsLoading } = useQuery(activeEventsQueryOptions());

  // Get user data and roles
  const { data: userData } = useQuery(userWithRolesQueryOptions());
  const { hasRole } = useUserRoles();

  const [showReturnsModeAlert, setShowReturnsModeAlert] = useState(false);
  const [showGalleryModeAlert, setShowGalleryModeAlert] = useState(false);
  const navigate = useNavigate();
  const matches = useMatches();
  // Get the returns mode mutations directly
  const { enterReturnsMutation, isEntering } = useReturnsMode();

  // Get the current active route for highlighting
  const currentPath = matches.length > 0 ? matches[matches.length - 1].pathname : '';

  // Filter menu items based on user roles
  const items = allItems.filter((item) => {
    // If no roles are required, show the item
    if (item.requiredRoles.length === 0) {
      return true;
    }

    // If user is admin or super_admin, show all items
    if (hasRole('admin') || hasRole('super_admin')) {
      return true;
    }

    // Otherwise, check if user has any of the required roles
    return item.requiredRoles.some((role) => hasRole(role));
  });

  const handleReturnsClick = (e: React.MouseEvent) => {
    console.log('[AppSidebar] Returns mode button clicked');
    e.preventDefault();
    setShowReturnsModeAlert(true);
  };

  const handleConfirmReturnsMode = () => {
    console.log('[AppSidebar] User confirmed entering returns mode');
    setShowReturnsModeAlert(false);

    // Use the mutation directly with callbacks
    enterReturnsMutation.mutate(undefined, {
      onSuccess: () => {
        console.log('[AppSidebar] Successfully entered returns mode');
        // Navigate to returns kiosk
        navigate({ to: '/kiosk/returns' });
      },
      onError: (err: Error) => {
        console.error('[AppSidebar] Error entering returns mode:', err);
        // Show an error toast or message here
      },
    });
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    console.log('[AppSidebar] Gallery mode button clicked');
    e.preventDefault();
    setShowGalleryModeAlert(true);
  };

  const handleConfirmGalleryMode = () => {
    console.log('[AppSidebar] User confirmed entering gallery mode');
    setShowGalleryModeAlert(false);

    // Use the same returns mode mutation to enter kiosk mode
    enterReturnsMutation.mutate(undefined, {
      onSuccess: () => {
        console.log('[AppSidebar] Successfully entered gallery mode');
        // Navigate to gallery kiosk
        navigate({ to: '/kiosk/gallery' });
      },
      onError: (err: Error) => {
        console.error('[AppSidebar] Error entering gallery mode:', err);
        // Show an error toast or message here
      },
    });
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {/* Use try-catch pattern instead of ErrorBoundary */}
        {isEventsLoading ? (
          <EventSwitcher events={[]} isLoading={true} />
        ) : events.length === 0 ? (
          <EventSwitcherFallback />
        ) : (
          <EventSwitcher events={events} isLoading={false} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={currentPath.startsWith(item.url)}
                    className={
                      currentPath.startsWith(item.url) ? 'bg-accent text-accent-foreground' : ''
                    }
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <span className="truncate">
                    {userData?.user_metadata?.first_name || userData?.email || 'User'}
                  </span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] bg-background/80"
              >
                <DropdownMenuItem>
                  <span onClick={() => (window.location.href = '/admin/settings')}>
                    App Settings
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span onClick={() => (window.location.href = '/admin/settings?tab=account')}>
                    Account Settings
                  </span>
                </DropdownMenuItem>
                {(hasRole('admin') || hasRole('super_admin')) && (
                  <DropdownMenuItem>
                    <span onClick={() => (window.location.href = '/admin/settings?tab=users')}>
                      User Management
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <span
                    className="cursor-pointer flex items-center gap-2"
                    onClick={handleGalleryClick}
                  >
                    {isEntering ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Entering Gallery Mode...</span>
                      </>
                    ) : (
                      <>
                        <Image className="h-4 w-4 mr-2" />
                        <span>Gallery Mode</span>
                      </>
                    )}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <span
                    className="cursor-pointer flex items-center gap-2"
                    onClick={handleReturnsClick}
                  >
                    {isEntering ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Entering Returns Mode...</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span>Returns Mode</span>
                      </>
                    )}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/logout">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Returns Mode Alert Dialog */}
      <ReturnsModeAlert
        isOpen={showReturnsModeAlert}
        onOpenChange={setShowReturnsModeAlert}
        onConfirm={handleConfirmReturnsMode}
        onCancel={() => setShowReturnsModeAlert(false)}
      />

      {/* Gallery Mode Alert Dialog */}
      <GalleryModeAlert
        isOpen={showGalleryModeAlert}
        onOpenChange={setShowGalleryModeAlert}
        onConfirm={handleConfirmGalleryMode}
        onCancel={() => setShowGalleryModeAlert(false)}
      />
    </Sidebar>
  );
}
