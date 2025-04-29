import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';

import { ErrorBoundary, ProfileError } from '@/components/students/profile/error-boundary';
import { ProfileSkeleton } from '@/components/students/profile/profile-skeleton';
import { StudentProfile } from '@/components/students/profile/student-profile';

export const Route = createFileRoute('/_protected/_student/profile/')({
  component: ProfilePage,
  loader: async ({ context }) => {
    // Ensure user and contact data are loaded
    await Promise.all([
      context.queryClient.ensureQueryData(userWithRolesQueryOptions()),
      context.queryClient.ensureQueryData(studentContactQueryOptions()),
    ]);

    // Get contact data from cache after ensuring it's loaded
    const contactData = context.queryClient.getQueryData(studentContactQueryOptions().queryKey);

    // Prefetch selfie data if contact_id is available
    if (contactData?.contact_id) {
      const { selfieQueryOptions } = await import('@/utils/selfies.server');
      await context.queryClient.ensureQueryData(selfieQueryOptions(contactData.contact_id));
    }

    return {
      title: 'Profile',
    };
  },
});

// Main component with Suspense and ErrorBoundary
function ProfilePage() {
  return (
    <ErrorBoundary fallback={(error) => <ProfileError error={error} />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <StudentProfile />
      </Suspense>
    </ErrorBoundary>
  );
}
