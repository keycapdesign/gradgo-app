import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getBackToListOptions } from '@/utils/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { ContactInfo, ContactImages, ContactBookings } from '@/components/contacts'
import { contactQueryOptions, contactImagesQueryOptions, contactBookingsQueryOptions, unassociatedImagesQueryOptions, relateImageToContact, unrelateImageFromContact, fetchUnassociatedImages } from '@/utils/contacts'
import { SuspenseWrapper, ContactInfoFallback, ContactImagesFallback, ContactBookingsFallback } from '@/components/suspense-wrapper'
import { ErrorBoundary, ContactInfoError, ContactImagesError, ContactBookingsError } from '@/components/error-boundary'

export const Route = createFileRoute('/_protected/admin/contacts/$contactId')({
  component: ContactDetailRoute,
  loader: ({ params }) => {
    return {
      contactId: params.contactId,
      title: `Contact ${params.contactId}`
    }
  }
})

function ContactDetailRoute() {
  const { contactId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch contact details using suspense queries
  const contactQuery = useSuspenseQuery(contactQueryOptions(contactId))
  const imagesQuery = useSuspenseQuery(contactImagesQueryOptions(contactId))
  const bookingsQuery = useSuspenseQuery(contactBookingsQueryOptions(contactId))

  // State for tracking the current page and date range
  const [currentPage, setCurrentPage] = useState(0)
  const [currentDateRange, setCurrentDateRange] = useState<[Date | undefined, Date | undefined] | undefined>(undefined)

  // For unassociated images, we use a regular query with enabled: false to prevent auto-fetching
  const unassociatedImagesQuery = useQuery({
    ...unassociatedImagesQueryOptions(contactId, currentDateRange, currentPage),
    enabled: false, // Prevent auto-fetching on mount
    refetchOnWindowFocus: false, // Prevent refetching on window focus
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  // Set up mutation for relating images to contacts
  const relateImageMutation = useMutation({
    mutationFn: (data: { contactId: string, imageId: string }) => {
      return relateImageToContact({ data })
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'images'] })
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'unassociatedImages'] })
      toast.success('Image added to contact')
    },
    onError: (error) => {
      toast.error(`Failed to add image: ${error.message}`)
    }
  })

  // Set up mutation for unrelating images from contacts
  const unrelateImageMutation = useMutation({
    mutationFn: (data: { contactId: string, imageId: string }) => {
      return unrelateImageFromContact({ data })
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'images'] })
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'unassociatedImages'] })
      toast.success('Image removed from contact')
    },
    onError: (error) => {
      toast.error(`Failed to remove image: ${error.message}`)
    }
  })

  // Extract data from queries
  const contact = contactQuery.data
  const images = imagesQuery.data || []
  const bookings = bookingsQuery.data || []
  const unassociatedImages = unassociatedImagesQuery.data || {
    images: [],
    pagination: {
      page: 0,
      pageSize: 12,
      totalCount: 0,
      totalPages: 0
    }
  }

  // Loading states
  const isContactLoading = contactQuery.isLoading
  const isImagesLoading = imagesQuery.isLoading
  const isBookingsLoading = bookingsQuery.isLoading
  const isUnassociatedImagesLoading = unassociatedImagesQuery.isLoading
  const contactError = contactQuery.error

  // Handle navigation back to contacts list with required search params
  const handleBackClick = () => {
    navigate(getBackToListOptions('contacts'))
  }

  // Handle searching for images
  const handleSearchImages = async (dateRange?: [Date | undefined, Date | undefined], page: number = 0) => {
    console.log('handleSearchImages called with:', {
      dateRange: dateRange ? [
        dateRange[0]?.toISOString(),
        dateRange[1]?.toISOString()
      ] : 'undefined',
      page
    })

    // Only proceed if we have a valid date range
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      console.error('Invalid date range provided to handleSearchImages')
      return
    }

    // Update the state with the current page and date range
    setCurrentPage(page)
    setCurrentDateRange(dateRange)

    // Format the date range for the query
    const formattedDateRange = [
      dateRange[0].toISOString(),
      dateRange[1].toISOString()
    ]

    console.log('Formatted date range:', formattedDateRange)

    // Create a new query with the updated parameters
    const newQuery = unassociatedImagesQueryOptions(contactId, dateRange, page)

    // Log the query key for debugging
    console.log('Query key:', newQuery.queryKey)

    // Create the parameters for the query
    const params = {
      contactId,
      dateRange: formattedDateRange,
      page,
      pageSize: 12
    }
    console.log('Query parameters:', params)

    try {
      // Fetch the data and update the query cache
      const result = await queryClient.fetchQuery({
        queryKey: newQuery.queryKey,
        queryFn: () => fetchUnassociatedImages({
          data: {
            contactId,
            dateRange: formattedDateRange,
            page,
            pageSize: 12
          }
        }),
        staleTime: 1000 * 60 * 5, // 5 minutes
      })

      console.log('Query result:', result)

      // Force a refetch of the unassociatedImagesQuery to update the UI
      unassociatedImagesQuery.refetch()

      return result
    } catch (error) {
      console.error('Query error:', error)
      toast.error('Error searching for images')
    }
  }

  // Handle relating an image to the contact
  const handleRelateImage = (imageId: string) => {
    relateImageMutation.mutate({ contactId, imageId })
  }

  // Handle unrelating an image from the contact
  const handleUnrelateImage = (imageId: string) => {
    unrelateImageMutation.mutate({ contactId, imageId })
  }

  // Show error states if any queries failed
  if (contactError) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-destructive mb-2">Error loading contact</p>
              <p className="text-muted-foreground">{contactError.message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  // Use router invalidate to refresh the route data
                  navigate({ to: `/admin/contacts/${contactId}` })
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Setup for the image upload dropzone
  const uploadProps = useSupabaseUpload({
    bucketName: 'images',
    path: `contact-${contactId}`,
    allowedMimeTypes: ['image/*'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    onSuccess: () => {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, 'unassociatedImages'] })
      // Refetch the query
      unassociatedImagesQuery.refetch()
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Button>
      </div>

      {/* Contact Information Section */}
      <div className="grid gap-6 mb-6">
        <ErrorBoundary fallback={<ContactInfoError />}>
          <SuspenseWrapper fallback={<ContactInfoFallback />}>
            <ContactInfo
              contact={contact}
              isLoading={isContactLoading}
            />
          </SuspenseWrapper>
        </ErrorBoundary>
      </div>

      {/* Contact Images Section */}
      <div className="relative grid gap-6 mb-6">
        <ErrorBoundary fallback={<ContactImagesError />}>
          <SuspenseWrapper fallback={<ContactImagesFallback />}>
            <ContactImages
              images={images}
              isImagesLoading={isImagesLoading}
              unassociatedImages={unassociatedImages}
              isUnassociatedImagesLoading={isUnassociatedImagesLoading}
              uploadProps={uploadProps}
              bookings={bookings}
              onSearchImages={handleSearchImages}
              onRelateImage={handleRelateImage}
              onUnrelateImage={handleUnrelateImage}
            />
          </SuspenseWrapper>
        </ErrorBoundary>
      </div>

      {/* Bookings Section */}
      <div className="grid gap-6">
        <ErrorBoundary fallback={<ContactBookingsError />}>
          <SuspenseWrapper fallback={<ContactBookingsFallback />}>
            <ContactBookings
              bookings={bookings}
              isLoading={isBookingsLoading}
            />
          </SuspenseWrapper>
        </ErrorBoundary>
      </div>
    </div>
  )
}
