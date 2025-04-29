import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function GalleryFallback() {
  return (
    <div className="min-h-screen container mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between py-4 border-b">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="px-4 mt-6">
        {/* Alert skeleton */}
        <Skeleton className="h-12 w-full mb-6" />

        {/* Photo grid skeleton */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-auto aspect-[3/4] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function RfidFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex-grow text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-5 w-32 mx-auto" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-32 mx-auto" />
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentPhotosFallback() {
  return (
    <div className="px-4 mt-6">
      {/* Alert skeleton */}
      <Skeleton className="h-12 w-full mb-6" />

      {/* Photo grid skeleton */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-auto aspect-[3/4] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
