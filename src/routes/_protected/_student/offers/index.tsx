import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { eventOffersQueryOptions } from '@/utils/events';
import { studentContactQueryOptions } from '@/utils/student-contact';

import { StudentOffers } from '@/components/students/offers/student-offers';

export const Route = createFileRoute('/_protected/_student/offers/')({
  component: OffersPage,
  loader: async ({ context }) => {
    // Fetch contact data to get the event_id
    const contactData = await context.queryClient.ensureQueryData(studentContactQueryOptions());

    // If we have an event_id, fetch the event offers
    if (contactData?.event_id) {
      await context.queryClient.ensureQueryData(
        eventOffersQueryOptions(contactData.event_id.toString())
      );
    }

    return {
      title: 'Offers',
    };
  },
});

function OffersPage() {
  return (
    <Suspense fallback={<div>Loading offers...</div>}>
      <StudentOffers />
    </Suspense>
  );
}
