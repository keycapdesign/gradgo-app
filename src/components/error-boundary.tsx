import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-lg font-medium">Something went wrong</h3>
          <p className="text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.handleRetry} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Contact error components
export function ContactInfoError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load contact information</h3>
      <p className="text-muted-foreground">
        We couldn't load the contact details. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function ContactImagesError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load contact images</h3>
      <p className="text-muted-foreground">
        We couldn't load the images for this contact. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function ContactBookingsError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load bookings</h3>
      <p className="text-muted-foreground">
        We couldn't load the bookings for this contact. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

// Event error components
export function EventDetailsError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load event information</h3>
      <p className="text-muted-foreground">
        We couldn't load the event details. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function ScheduleItemsError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load schedule items</h3>
      <p className="text-muted-foreground">
        We couldn't load the schedule items for this event. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function OffersError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load offers</h3>
      <p className="text-muted-foreground">
        We couldn't load the offers for this event. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function FeaturesError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load features</h3>
      <p className="text-muted-foreground">
        We couldn't load the features for this event. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}

export function EventSettingsError() {
  const router = useRouter()

  return (
    <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-4">
      <div className="flex justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-medium">Failed to load event settings</h3>
      <p className="text-muted-foreground">
        We couldn't load the event settings. Please try again later.
      </p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reload Page
      </Button>
    </div>
  )
}
