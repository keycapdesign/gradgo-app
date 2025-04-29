import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { getSignedUrl } from '@/utils/supabase/get-signed-url-client'
import { fetchSelfieForContact } from '@/utils/selfies.server'

// Query keys
export const contactKeys = {
  all: ['contacts'] as const,
  detail: (id: string) => [...contactKeys.all, id] as const,
  images: (id: string) => [...contactKeys.detail(id), 'images'] as const,
  bookings: (id: string) => [...contactKeys.detail(id), 'bookings'] as const,
  unassociatedImages: (id: string, filters?: { search?: string, dateRange?: string[] }) =>
    [...contactKeys.detail(id), 'unassociatedImages', filters] as const,
}

// Fetch contact by ID
export function useContactQuery(contactId: string) {
  return useQuery({
    queryKey: contactKeys.detail(contactId),
    queryFn: async () => {
      console.log(`Fetching contact ${contactId}`)
      const supabase = createClient()

      // Fetch contact details
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (error) {
        console.error(`Error fetching contact: ${error.message}`)
        throw new Error(`Error fetching contact: ${error.message}`)
      }

      console.log(`Found contact ${contactId}:`, {
        id: contact.id,
        name: contact.full_name,
        selfie_path: contact.selfie_path
      })

      // Fetch selfie record using shared server utility
      if (contact && contact.id) {
        const selfieRecord = await fetchSelfieForContact(contact.id)
        if (selfieRecord && selfieRecord.path) {
          let signedUrl = await getSignedUrl('face_id_images', selfieRecord.path)
          if (signedUrl) {
            contact.selfieSignedUrl = signedUrl
            contact.selfie_path = selfieRecord.path
            console.log(`Got signed URL for selfie: ${signedUrl.substring(0, 50)}...`)
          } else {
            console.error(`Failed to get signed URL for selfie with path ${selfieRecord.path}`)
            // Try with images bucket as fallback
            signedUrl = await getSignedUrl('images', selfieRecord.path)
            if (signedUrl) {
              contact.selfieSignedUrl = signedUrl
              contact.selfie_path = selfieRecord.path
              console.log(`Got signed URL for selfie from images bucket: ${signedUrl.substring(0, 50)}...`)
            } else {
              console.error(`Failed to get signed URL for selfie from images bucket`)
            }
          }
        } else {
          console.log(`No selfie record found for contact ${contact.id}`)
        }
      } else {
        console.log(`Contact ${contactId} has no id`)
      }

      return contact
    },
  })
}

// Fetch contact images
export function useContactImagesQuery(contactId: string) {
  return useQuery({
    queryKey: contactKeys.images(contactId),
    queryFn: async () => {
      console.log(`Fetching images for contact ${contactId}`)
      const supabase = createClient()

      // Fetch contact images
      const { data: images, error } = await supabase
        .from('contact_images')
        .select('*, image:image_id(*)')
        .eq('contact_id', contactId)

      if (error) {
        console.error(`Error fetching contact images: ${error.message}`)
        throw new Error(`Error fetching contact images: ${error.message}`)
      }

      console.log(`Found ${images?.length || 0} images for contact ${contactId}`)

      // Log the image paths for debugging
      if (images && images.length > 0) {
        console.log('Image paths:')
        images.forEach((imageData, index) => {
          if (imageData.image) {
            console.log(`Image ${index + 1}:`, {
              id: imageData.id,
              image_id: imageData.image_id,
              watermarked_path: imageData.image.watermarked_image_path,
              original_path: imageData.image.original_image_path
            })
          } else {
            console.log(`Image ${index + 1}: No image data`, imageData)
          }
        })
      }

      // Generate signed URLs for each image
      if (images && images.length > 0) {
        for (const imageData of images) {
          console.log(`Processing image ${imageData.id}:`, imageData)

          if (!imageData.image) {
            console.error(`Image data missing for image ${imageData.id}`)
            continue
          }

          if (imageData.image?.watermarked_image_path) {
            console.log(`Getting signed URL for image ${imageData.id} with path ${imageData.image.watermarked_image_path}`)

            // Only use the watermarked_images bucket
            const signedUrl = await getSignedUrl('watermarked_images', imageData.image.watermarked_image_path)

            if (signedUrl) {
              imageData.signedUrl = signedUrl
              console.log(`Got signed URL for image ${imageData.id}: ${signedUrl.substring(0, 50)}...`)
            } else {
              console.error(`Failed to get signed URL for image ${imageData.id} with path ${imageData.image.watermarked_image_path}`)
            }
          } else {
            console.error(`Missing watermarked_image_path for image ${imageData.id}`)
          }
        }
      }

      return images
    },
  })
}

// Fetch contact bookings
export function useContactBookingsQuery(contactId: string) {
  return useQuery({
    queryKey: contactKeys.bookings(contactId),
    queryFn: async () => {
      const supabase = createClient()

      // Fetch contact bookings
      const { data: bookings, error } = await supabase
        .from('distinct_contact_bookings')
        .select('*, event(*), gown(*)')
        .eq('contact', contactId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Error fetching contact bookings: ${error.message}`)
      }

      return bookings
    },
  })
}

// Fetch unassociated images
export function useUnassociatedImagesQuery(
  contactId: string,
  options: {
    search?: string,
    dateRange?: [Date | undefined, Date | undefined],
    enabled?: boolean
  }
) {
  const formattedDateRange = options.dateRange &&
    options.dateRange[0] &&
    options.dateRange[1]
      ? [options.dateRange[0].toISOString(), options.dateRange[1].toISOString()]
      : undefined

  return useQuery({
    queryKey: contactKeys.unassociatedImages(contactId, {
      search: options.search,
      dateRange: formattedDateRange
    }),
    queryFn: async () => {
      const supabase = createClient()

      // Fetch unassociated images using the RPC function
      const { data: images, error } = await supabase
        .rpc('get_unassociated_images', {
          p_contact_id: parseInt(contactId),
          p_search: options.search || null,
          p_date_range: formattedDateRange || null,
          p_limit: 50,
          p_offset: 0
        })

      if (error) {
        throw new Error(`Error fetching unassociated images: ${error.message}`)
      }

      // Generate signed URLs for each image
      if (images && images.length > 0) {
        console.log(`Processing ${images.length} unassociated images`)
        for (const image of images) {
          if (image.watermarked_image_path) {
            console.log(`Getting signed URL for unassociated image with path ${image.watermarked_image_path}`)

            // Only use the watermarked_images bucket
            const signedUrl = await getSignedUrl('watermarked_images', image.watermarked_image_path)

            if (signedUrl) {
              image.signedUrl = signedUrl
              console.log(`Got signed URL for unassociated image: ${signedUrl.substring(0, 50)}...`)
            } else {
              console.error(`Failed to get signed URL for unassociated image with path ${image.watermarked_image_path}`)
            }
          } else {
            console.error(`Missing watermarked_image_path for unassociated image:`, image.id)
          }
        }
      }

      return images
    },
    enabled: options.enabled ?? true,
  })
}

// Mutation to relate an image to a contact
export function useRelateImageToContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ contactId, imageId }: { contactId: string, imageId: string }) => {
      const supabase = createClient()

      // Create a new contact_images record
      const { data, error } = await supabase
        .from('contact_images')
        .insert({
          contact_id: parseInt(contactId),
          image_id: imageId
        })
        .select()

      if (error) {
        throw new Error(`Error relating image to contact: ${error.message}`)
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.images(variables.contactId) })
      queryClient.invalidateQueries({
        queryKey: contactKeys.unassociatedImages(variables.contactId)
      })

      toast.success('Image added to contact')
    },
    onError: (error) => {
      toast.error(`Failed to add image: ${error.message}`)
    }
  })
}
