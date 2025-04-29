import { createFileRoute, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Info, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fetchPublicGallery } from '@/utils/public-gallery'
import { createSquareCheckoutLink } from '@/utils/square/checkout'
import { trackGalleryViewEvent } from '@/utils/event-tracking'

// Import custom components
import { PhotoGallery, Photo } from '@/components/gallery/photo-gallery'
import { GalleryFallback } from '@/components/gallery/gallery-fallback'
import { CheckoutStatus, CheckoutStatusScreen } from '@/components/gallery/checkout-status'
import { GalleryHeader } from '@/components/gallery/gallery-header'
import { LoginDialog } from '@/components/auth/login-dialog'
import { MagicLinkAuth } from '@/components/auth/magic-link-auth'
import { createClient } from '@/utils/supabase/client'

export const Route = createFileRoute('/public/gallery/$contactId')({
  validateSearch: z.object({
    checkout: z.enum(['true']).optional(),
  }),
  component: PublicGalleryView,
  loader: ({ params }) => {
    return {
      contactId: params.contactId,
      title: `Gallery - Contact ${params.contactId}`
    }
  },
  errorComponent: ({ error }) => {
    console.error('[PublicGalleryRoute] Error:', error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-destructive">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error.message}</p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="h-12 px-6 text-lg"
              >
                Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
})

function PublicGalleryView() {
  const { contactId } = useParams({ from: '/public/gallery/$contactId' })
  const navigate = useNavigate()

  // State for UI control
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showMagicLinkAuth, setShowMagicLinkAuth] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Function to completely reset the form state
  const resetToInitialState = () => {
    console.log('Resetting to initial state - clearing all state variables')
    setSelectedPhotos([])
    setCheckoutStatus(null)
    setShowLoginDialog(false)
    setShowMagicLinkAuth(false)
  }

  // Contact images query
  const {
    data: contactData,
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: ['public', 'gallery', contactId],
    queryFn: async () => {
      try {
        console.log(`Fetching public gallery for ID: ${contactId}`)
        const result = await fetchPublicGallery({
          data: {
            contactId: contactId
          }
        })

        // Validate the result structure
        if (!result || typeof result !== 'object') {
          console.error('Invalid contact data result:', result)
          throw new Error('Invalid response format from server')
        }

        // Ensure contact data is present
        if (!result.contact || !result.contact.id) {
          console.error('Missing contact data in result:', result)
          throw new Error('Missing contact information in response')
        }

        // Ensure images array is present (even if empty)
        if (!Array.isArray(result.images)) {
          console.error('Missing images array in result:', result)
          result.images = []
        }

        console.log(`Successfully fetched contact data with ${result.images.length} images`)
        return result
      } catch (error) {
        console.error('Error fetching contact data:', error)
        throw error
      }
    },
    enabled: !!contactId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  // Handle photo selection changes
  const handleSelectionChange = (photos: Photo[]) => {
    setSelectedPhotos(photos)
  }

  // Get search params
  const { checkout } = useSearch({ from: '/public/gallery/$contactId' })

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    checkAuth()

    // Set up auth state change listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)

      // If user just signed in and we were in the checkout flow, proceed with checkout
      if (event === 'SIGNED_IN') {
        // Check if we were in the checkout flow or redirected with checkout=true
        if (showLoginDialog || showMagicLinkAuth || checkout === 'true') {
          setShowLoginDialog(false)
          setShowMagicLinkAuth(false)
          handleLoginSuccess()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkout, showLoginDialog, showMagicLinkAuth])

  // Track gallery view when contact data is loaded
  useEffect(() => {
    if (contactData && 'contact' in contactData && 'event' in contactData && contactData.event?.id) {
      trackGalleryViewEvent(
        parseInt(contactId),
        contactData.event.id
      ).catch(error => {
        console.error('Error tracking gallery view:', error);
      });
    }
  }, [contactId, contactData]);

  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null)

  // Handle checkout button click
  const handleCheckout = () => {
    // Clear any previous errors
    setValidationError(null)

    if (selectedPhotos.length === 0) {
      setValidationError('Please select at least one photo')
      return
    }

    // Check if any purchase options are selected
    const hasSelectedOptions = selectedPhotos.some(photo => {
      const options = photo.purchaseOptions
      return options && (options.digitalDownload || options.printCopy)
    })

    if (!hasSelectedOptions) {
      setValidationError('Please select purchase options for at least one photo')
      return
    }

    // Check if user is authenticated
    if (isAuthenticated) {
      // User is already logged in, proceed to checkout
      handleLoginSuccess()
    } else {
      // Show magic link auth dialog
      setShowMagicLinkAuth(true)
    }
  }

  // Handle purchase options change
  const handlePurchaseOptionsChange = (photoId: string, options: { digitalDownload: boolean, printCopy: boolean }) => {
    console.log('Purchase options changed:', photoId, options)
    setSelectedPhotos(prev => {
      return prev.map(photo => {
        if (photo.id === photoId) {
          return { ...photo, purchaseOptions: options }
        }
        return photo
      })
    })
  }

  // Create checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: createSquareCheckoutLink,
    onSuccess: (data) => {
      console.log('Checkout link created:', data)
      // Redirect to Square checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setValidationError('Failed to create checkout link')
        setCheckoutStatus(null)
      }
    },
    onError: (error) => {
      console.error('Error creating checkout link:', error)
      setValidationError(error instanceof Error ? error.message : 'Failed to create checkout link')
      setCheckoutStatus(null)
    }
  })

  // Handle login success
  const handleLoginSuccess = () => {
    setShowLoginDialog(false)
    setCheckoutStatus('processing')

    // Get selected images with purchase options
    const checkoutImages = selectedPhotos.map(photo => ({
      id: photo.id,
      purchaseOptions: photo.purchaseOptions || { digitalDownload: true, printCopy: false }
    }))

    // Create checkout link
    checkoutMutation.mutate({
      data: {
        contactId: parseInt(contactId),
        images: checkoutImages,
        redirectUrl: window.location.origin + '/checkout/success'
      }
    })
  }



  // Show loading state while fetching contact data
  if (isLoading || isFetching) {
    return <GalleryFallback />
  }

  // Show error state if there was an error fetching contact data
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-destructive">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error.message}</p>
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                className="h-12 px-6 text-lg"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show photo gallery if contact data is loaded
  if (contactData && 'contact' in contactData && 'images' in contactData) {
    return (
      <>
        <div className="min-h-screen container mx-auto">
          <div className="relative">
            <GalleryHeader
              title={`${contactData.contact.name}'s Gallery`}
              selectedCount={selectedPhotos.length}
              onCheckoutClick={handleCheckout}
              checkoutButtonText="Proceed to Checkout"
              checkoutButtonIcon="cart"
              showExitButton={false}
            />

            {/* Sign in button */}
            {!isAuthenticated && (
              <div className="absolute top-6 right-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>

          <div className="py-6 px-4">
            {validationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {contactData.images && contactData.images.length > 0 ? (
              <PhotoGallery
                photos={contactData.images.map((img: any) => ({
                  id: img.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
                  url: img.url || '',
                  isPrintReady: false, // Public gallery images are never print ready
                  originalPath: img.path || '',
                  purchaseOptions: {
                    digitalDownload: true,
                    printCopy: false
                  }
                })).filter((img: any) => img.url)}
                onSelectionChange={handleSelectionChange}
                onPurchaseOptionsChange={handlePurchaseOptionsChange}
                showPurchaseOptions={true}
                isPrintingAvailable={contactData.event?.is_printing_available ?? false}
                isLoading={checkoutStatus !== null}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Alert className="max-w-md">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No photos found for this contact.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>



        {/* Login Dialog - Traditional login for users who already have passwords */}
        {showLoginDialog && (
          <LoginDialog
            isOpen={showLoginDialog}
            onOpenChange={setShowLoginDialog}
            onSuccess={handleLoginSuccess}
          />
        )}

        {/* Magic Link Auth - For users who haven't completed account setup */}
        {showMagicLinkAuth && (
          <MagicLinkAuth
            isOpen={showMagicLinkAuth}
            onOpenChange={setShowMagicLinkAuth}
            onSuccess={handleLoginSuccess}
            redirectUrl={`${window.location.origin}/public/gallery/${contactId}?checkout=true`}
            contactId={contactId}
          />
        )}

        {/* Checkout status overlay */}
        {checkoutStatus && (
          <CheckoutStatusScreen
            status={checkoutStatus}
            onClose={resetToInitialState}
          />
        )}
      </>
    )
  }

  // Default view - should not reach here
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Gallery Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>We couldn't find the gallery you're looking for.</p>
          <div className="mt-4">
            <Button
              onClick={() => navigate({ to: '/' })}
              size="lg"
              className="h-12 px-6 text-lg"
            >
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
