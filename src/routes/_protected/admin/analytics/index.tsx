import { createFileRoute } from '@tanstack/react-router';
import { usePostHogPageView } from '@/utils/posthog';
import { hasRouteAccess } from '@/utils/route-access';

import { AnalyticsDashboard } from '@/components/admin/analytics/analytics-dashboard';
import { AnalyticsHeader } from '@/components/admin/analytics/analytics-header';
import { UnauthorizedError } from '@/components/unauthorized';

export const Route = createFileRoute('/_protected/admin/analytics/')({
  beforeLoad: async ({ context }) => {
    // Check if the user has access to this route
    const userRoles = context.userRoles || [];
    const hasAccess = hasRouteAccess(userRoles, '/admin/analytics');

    if (!hasAccess) {
      console.log('[AnalyticsRoute] User does not have access to analytics');
      throw new Error('Unauthorized');
    }

    return {
      title: 'Analytics',
    };
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Unauthorized') {
      return (
        <div className="min-h-screen bg-background">
          <UnauthorizedError />
        </div>
      );
    }

    throw error;
  },
  loader: () => {
    return {
      title: 'Analytics',
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  // Track page view in PostHog
  usePostHogPageView('Analytics');

  return (
    <div className="container mx-auto py-10">
      <AnalyticsHeader />
      <AnalyticsDashboard />
    </div>
  );
}
