import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Image,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Users,
} from 'lucide-react';
import { StatCard } from './stat-card';
import { useEventStore } from '@/stores/event-store';
import { eventAnalyticsQueryOptions } from '@/utils/analytics';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function AnalyticsDashboard() {
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const selectedEventId = selectedEvent?.id;

  // Fetch analytics data for the selected event
  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useQuery(eventAnalyticsQueryOptions(selectedEventId || 0));

  // If no event is selected, show a message
  if (!selectedEventId) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No event selected</AlertTitle>
        <AlertDescription>
          Please select an event from the event switcher in the sidebar to view analytics data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8 pt-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Event Overview</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Contacts"
              value={analyticsData?.totalContacts || 0}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Confirmed Users"
              value={analyticsData?.confirmedUsers || 0}
              description="Users who have confirmed their email"
              icon={CheckCircle}
              total={analyticsData?.totalContacts}
              isLoading={isLoading}
            />
            <StatCard
              title="Selfies Uploaded"
              value={analyticsData?.selfiesUploaded || 0}
              icon={Image}
              total={analyticsData?.totalContacts}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">User Engagement</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Feature Clicks"
              value={analyticsData?.featureClicks || 0}
              icon={MousePointerClick}
              isLoading={isLoading}
            />
            <StatCard
              title="Offer Clicks"
              value={analyticsData?.offerClicks || 0}
              icon={MousePointerClick}
              isLoading={isLoading}
            />
            <StatCard
              title="Gallery Views"
              value={analyticsData?.galleryViews || 0}
              icon={Eye}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
