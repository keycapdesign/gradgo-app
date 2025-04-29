import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { addDays, format, isBefore } from 'date-fns';
import {
  BarChart,
  Calendar,
  CalendarClock,
  Clock,
  Contact2,
  GraduationCap,
  Home,
  Settings,
  Sparkles,
  Tag,
} from 'lucide-react';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { activeEventsQueryOptions, allEventsQueryOptions } from '@/utils/all-events';
import { useUserRoles } from '@/hooks/use-user-roles';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define Event interface for this component
interface EventType {
  id: number;
  name: string;
  datetime?: string;
  is_active?: boolean;
}

export const Route = createFileRoute('/_protected/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  // Use the parent route's data
  const { hasRole } = useUserRoles();
  const { data: userData } = useQuery(userWithRolesQueryOptions());

  // Get active events using the proper query options
  const { data: activeEvents = [] } = useQuery(activeEventsQueryOptions());

  // Get all events using the proper query options
  const { data: allEvents = [] } = useQuery(allEventsQueryOptions());

  // Get user's first name for personalized greeting
  const firstName =
    userData?.user_metadata?.first_name || userData?.user_metadata?.name?.split(' ')[0] || 'there';

  // We already have active events from the query

  // Filter events to get upcoming events (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  const upcomingEvents =
    allEvents
      ?.filter((event: EventType) => {
        if (!event.datetime) return false;
        const eventDate = new Date(event.datetime);
        return isBefore(eventDate, thirtyDaysFromNow) && isBefore(today, eventDate);
      })
      .sort((a: EventType, b: EventType) => {
        return new Date(a.datetime || '').getTime() - new Date(b.datetime || '').getTime();
      }) || [];

  // Determine role-specific welcome message
  let roleMessage = 'Welcome to your dashboard';
  if (hasRole('super_admin')) {
    roleMessage = 'Welcome to the GradGo admin dashboard';
  } else if (hasRole('admin')) {
    roleMessage = 'Welcome to the GradGo admin dashboard';
  } else if (hasRole('ceremony_manager')) {
    roleMessage = 'Welcome to the GradGo ceremony management dashboard';
  } else if (hasRole('customer_service')) {
    roleMessage = 'Welcome to the GradGo customer service dashboard';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Hi {firstName}!</h1>
        <p className="text-muted-foreground">{roleMessage}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active events in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Events in the next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total events in the system</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Event Manager - All roles */}
          <Link to="/admin/event-manager" search={{}} className="no-underline">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <Home className="h-5 w-5 text-primary mb-2" />
                <CardTitle>Event Manager</CardTitle>
                <CardDescription>Manage bookings and check-ins/outs</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Contacts - All roles */}
          <Link
            to="/admin/contacts"
            search={{
              page: 1,
              pageSize: 10,
              sortBy: 'created_at',
              sortDirection: 'desc',
              search: '',
              order_type: undefined,
              event_id: undefined,
            }}
            className="no-underline"
          >
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <Contact2 className="h-5 w-5 text-primary mb-2" />
                <CardTitle>Contacts</CardTitle>
                <CardDescription>View and manage student contacts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Gowns - All roles */}
          <Link
            to="/admin/gowns"
            search={{
              page: 1,
              pageSize: 10,
              sortBy: 'created_at',
              sortDirection: 'desc',
              search: '',
            }}
            className="no-underline"
          >
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <GraduationCap className="h-5 w-5 text-primary mb-2" />
                <CardTitle>Gowns</CardTitle>
                <CardDescription>Manage gown inventory and assignments</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Events - Admin, Super Admin, Ceremony Manager */}
          {(hasRole('admin') || hasRole('super_admin') || hasRole('ceremony_manager')) && (
            <Link to="/admin/events" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Calendar className="h-5 w-5 text-primary mb-2" />
                  <CardTitle>Events</CardTitle>
                  <CardDescription>Create and manage graduation events</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Offers - Admin, Super Admin, Ceremony Manager */}
          {(hasRole('admin') || hasRole('super_admin') || hasRole('ceremony_manager')) && (
            <Link to="/admin/offers" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Tag className="h-5 w-5 text-primary mb-2" />
                  <CardTitle>Offers</CardTitle>
                  <CardDescription>Manage special offers and discounts</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Features - Admin, Super Admin, Ceremony Manager */}
          {(hasRole('admin') || hasRole('super_admin') || hasRole('ceremony_manager')) && (
            <Link to="/admin/features" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Sparkles className="h-5 w-5 text-primary mb-2" />
                  <CardTitle>Features</CardTitle>
                  <CardDescription>Manage featured content and promotions</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Analytics - Admin, Super Admin only */}
          {(hasRole('admin') || hasRole('super_admin')) && (
            <Link to="/admin/analytics" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <BarChart className="h-5 w-5 text-primary mb-2" />
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View system analytics and reports</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Settings - Admin, Super Admin only */}
          {(hasRole('admin') || hasRole('super_admin')) && (
            <Link to="/admin/settings" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <Settings className="h-5 w-5 text-primary mb-2" />
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Manage system settings and users</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Upcoming Events Calendar */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Events (Next 30 Days)</h2>
        {(upcomingEvents?.length || 0) > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingEvents.slice(0, 5).map((event: EventType) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-col">
                      <Link
                        to="/admin/events/$eventId"
                        params={{ eventId: event.id.toString() }}
                        search={{}}
                        className="font-medium hover:underline"
                      >
                        {event.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {event.datetime ? format(new Date(event.datetime), 'PPP') : 'No date set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/events/$eventId"
                        params={{ eventId: event.id.toString() }}
                        search={{}}
                      >
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            {(upcomingEvents?.length || 0) > 5 && (
              <CardFooter className="border-t px-6 py-4">
                <Link
                  to="/admin/events"
                  search={{}}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View all {upcomingEvents?.length || 0} upcoming events
                </Link>
              </CardFooter>
            )}
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center py-10">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No upcoming events in the next 30 days
              </p>
              {(hasRole('admin') || hasRole('super_admin') || hasRole('ceremony_manager')) && (
                <Link to="/admin/events" search={{}} className="mt-4">
                  <Button variant="outline">Manage Events</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {(hasRole('admin') || hasRole('super_admin') || hasRole('ceremony_manager')) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Create Offer - Admin, Super Admin, Ceremony Manager */}
            <Link to="/admin/offers" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Create New Offer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create a new special offer or discount
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Create Feature - Admin, Super Admin, Ceremony Manager */}
            <Link to="/admin/features" search={{}} className="no-underline">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Create New Feature</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create a new featured content item
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
