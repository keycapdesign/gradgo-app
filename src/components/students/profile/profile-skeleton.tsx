import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Profile Card Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                <div className="flex flex-col items-center gap-2 mt-2 sm:items-start">
                  <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 mx-auto sm:mx-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support and About Us Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
