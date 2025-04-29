import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { studentContactQueryOptions } from '@/utils/student-contact';

import { StudentSchedule } from '@/components/students/schedule/student-schedule';

export const Route = createFileRoute('/_protected/_student/schedule/')({
  component: SchedulePage,
  loader: async ({ context }) => {
    // Ensure contact data is loaded
    await context.queryClient.ensureQueryData(studentContactQueryOptions());

    return {
      title: 'Schedule',
    };
  },
});

function SchedulePage() {
  return (
    <Suspense fallback={<div>Loading schedule...</div>}>
      <StudentSchedule />
    </Suspense>
  );
}
