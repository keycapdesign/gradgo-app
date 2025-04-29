import { Suspense, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>
      {children}
    </Suspense>
  )
}

function DefaultFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

// Contact fallbacks
export function ContactInfoFallback() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function ContactImagesFallback() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-48 rounded-md flex-none" />
        ))}
      </div>
    </div>
  )
}

export function ContactBookingsFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Event fallbacks
export function EventDetailsFallback() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function ScheduleItemsFallback() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-md space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OffersFallback() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-md flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeaturesFallback() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-md flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EventSettingsFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  )
}
