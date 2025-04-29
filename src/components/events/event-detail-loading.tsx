import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function EventDetailLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>

        <Skeleton className="h-10 w-28" />
      </div>

      <div className="space-y-6">
        {/* Main Event Details Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Settings Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Items Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="border rounded-md p-4">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers and Features section skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offers Card Skeleton */}
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="border rounded-md p-4">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card Skeleton */}
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="border rounded-md p-4">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
