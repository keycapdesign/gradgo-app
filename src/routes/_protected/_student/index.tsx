import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { eventFeaturesQueryOptions } from '@/utils/event-features';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';

import { StudentHome } from '@/components/students/home/student-home';

export const Route = createFileRoute('/_protected/_student/')({
  component: HomePage,
  loader: async ({ context }) => {
    // Ensure data is loaded
    const contactData = await context.queryClient.ensureQueryData(studentContactQueryOptions());
    await context.queryClient.ensureQueryData(userWithRolesQueryOptions());

    // If we have an event_id, fetch the event features
    if (contactData?.event_id) {
      await context.queryClient.ensureQueryData(eventFeaturesQueryOptions(contactData.event_id));
    }

    // Prefetch selfie data if contact_id is available
    if (contactData?.contact_id) {
      const { selfieQueryOptions } = await import('@/utils/selfies.server');
      await context.queryClient.ensureQueryData(selfieQueryOptions(contactData.contact_id));
    }

    return {
      title: 'Home',
    };
  },
});

function HomePage() {
  return (
    <Suspense fallback={<div>Loading home page...</div>}>
      <StudentHome />
    </Suspense>
  );
}
