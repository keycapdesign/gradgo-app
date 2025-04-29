import { createFileRoute } from '@tanstack/react-router';

import { UnauthorizedError } from '@/components/unauthorized';

export const Route = createFileRoute('/unauthorized')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: (search.returnTo as string) || '/',
  }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const { returnTo } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <UnauthorizedError returnTo={returnTo} />
    </div>
  );
}
