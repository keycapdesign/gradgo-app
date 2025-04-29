import { createServerFn } from '@tanstack/react-start'
import { createAdminClient } from '@/utils/supabase/server'
import { getSignedUrl } from '@/utils/supabase/get-signed-url'

// Helper function to check if printing is still available
function isPrintingStillAvailable(printingEndTime: string | null): boolean {
  if (!printingEndTime) return false

  try {
    const endTime = new Date(printingEndTime)
    const now = new Date()
    return now < endTime
  } catch (error) {
    console.error('Error parsing printing end time:', error)
    return false
  }
}

// Function to fetch public gallery data by contact ID
// This function uses the secure views to limit exposure of sensitive data
export const fetchPublicGallery = createServerFn({ method: 'GET' })
  .validator((data: { contactId: string }) => ({
    contactId: data.contactId
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data
    console.log(`Fetching public gallery for contact ID: ${contactId}`)
    const supabase = createAdminClient()

    // Fetch the contact information from the secure view
    const { data: contact, error: contactError } = await supabase
      .from('public_gallery_contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (contactError) {
      console.error(`Error fetching contact: ${contactError.message}`)
      throw new Error(`Error fetching contact: ${contactError.message}`)
    }

    if (!contact) {
      throw new Error(`No contact found with ID: ${contactId}`)
    }

    // Check if printing is still available
    const isPrintingAvailable = isPrintingStillAvailable(contact.printing_end_time)

    // Fetch images for this contact from the secure view
    const { data: contactImages, error: imagesError } = await supabase
      .from('public_gallery_images')
      .select('*')
      .eq('contact_id', contactId)

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`)
      throw new Error(`Error fetching contact images: ${imagesError.message}`)
    }

    console.log(`Found ${contactImages?.length || 0} images for contact ID: ${contactId}`)

    // Process images to get signed URLs
    const processImage = async (item: any) => {
      try {
        // Always use watermarked images for public gallery
        const imagePath = item.watermarked_image_path || item.original_image_path

        if (!imagePath) {
          return null
        }

        const bucket = 'watermarked_images'
        const signedUrl = await getSignedUrl(bucket, imagePath)

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.timestamp || null,
          path: imagePath
        }
      } catch (error) {
        console.error(`Error processing image:`, error)
        return null
      }
    }

    // Process all images with a timeout
    const processImagesWithTimeout = async () => {
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Timeout reached for image processing')
          resolve([])
        }, 15000) // 15 second timeout
      })

      const processedImagesPromise = Promise.all(
        (contactImages || []).map(processImage)
      )

      return Promise.race([processedImagesPromise, timeoutPromise])
    }

    const processedImages = await processImagesWithTimeout()

    // Filter out null values and sort by timestamp (newest first)
    const validImages = processedImages
      .filter(img => img !== null && img.url)
      .sort((a, b) => {
        if (!a?.timestamp) return 1
        if (!b?.timestamp) return -1
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

    return {
      contact: {
        id: contact.id,
        name: contact.full_name?.trim() || 'Unknown'
      },
      event: {
        id: contact.event_id,
        name: contact.event_name,
        is_printing_available: isPrintingAvailable
      },
      images: validImages
    }
  })
