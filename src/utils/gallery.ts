import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getSignedUrl } from '@/utils/supabase/get-signed-url';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Helper function to check if printing is still available
function isPrintingStillAvailable(printingEndTime: string | null): boolean {
  if (!printingEndTime) return false;

  try {
    const endTime = new Date(printingEndTime);
    const now = new Date();
    return now < endTime;
  } catch (error) {
    console.error('Error parsing printing end time:', error);
    return false;
  }
}

// Function to fetch student info and photos by gown RFID
export const fetchStudentByGownRfid = createServerFn({ method: 'GET' })
  .validator((data: { rfid: string; eventId?: number }) => ({
    rfid: data.rfid,
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { rfid, eventId } = ctx.data;
    console.log(`Fetching student info for gown with RFID: ${rfid}`);
    const supabase = createServerClient();

    // Query the latest_gown_bookings_by_checkout view to find the booking associated with this RFID
    const { data: booking, error } = await supabase
      .from('latest_gown_bookings_by_checkout')
      .select('*')
      .eq('rfid', rfid)
      .single();

    if (error) {
      console.error(`Error fetching booking by gown RFID: ${error.message}`);
      throw new Error(`Error fetching booking by gown RFID: ${error.message}`);
    }

    if (!booking) {
      throw new Error(`No booking found for gown with RFID: ${rfid}`);
    }

    // If eventId is provided, check if the booking is for this event
    if (eventId && booking.event_id !== eventId) {
      throw new Error(`This gown is associated with a different event`);
    }

    // Get the contact_id from the booking
    const contactId = booking.contact;

    if (!contactId) {
      throw new Error(`No contact found for this booking`);
    }

    // Fetch images for this contact
    const { data: contactImages, error: imagesError } = await supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId);

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`);
      throw new Error(`Error fetching contact images: ${imagesError.message}`);
    }

    console.log('Contact images: ', contactImages);

    // Process images to get signed URLs
    console.log(`Starting to process ${contactImages?.length || 0} images for signed URLs`);

    // Create a timeout promise to prevent hanging indefinitely
    const timeoutPromise = (timeoutMs: number) => {
      return new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log(`Timeout of ${timeoutMs}ms reached for image processing`);
          resolve(null);
        }, timeoutMs);
      });
    };

    // Process each image with a timeout
    const processImageWithTimeout = async (item: any, index: number) => {
      try {
        if (!item.image || !item.image.original_image_path) {
          console.log(`Image ${index} has no original_image_path, skipping`);
          return null;
        }

        console.log(`Getting signed URL for image ${index}: ${item.image.original_image_path}`);

        // Race between the actual operation and a timeout
        const signedUrl = await Promise.race([
          getSignedUrl('original_images', item.image.original_image_path),
          timeoutPromise(5000), // 5 second timeout per image
        ]);

        if (!signedUrl) {
          console.log(
            `Failed to get signed URL for image ${index}: ${item.image.original_image_path}`
          );
        } else {
          console.log(`Successfully got signed URL for image ${index}`);
        }

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.image?.timestamp || null,
          path: item.image.watermarked_path || item.image.original_path,
          purchased_print: item.purchased_print || false,
          print_credits: item.print_credits || 0,
        };
      } catch (error) {
        console.error(`Error processing image ${index}:`, error);
        return null;
      }
    };

    // Process all images with a global timeout
    const images = await Promise.race([
      Promise.all((contactImages || []).map(processImageWithTimeout)),
      new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Global timeout of 15 seconds reached for all image processing');
          resolve((contactImages || []).map(() => null));
        }, 15000); // 15 second global timeout
      }),
    ]);

    console.log('Processed images: ', images);

    // Filter out null values and sort by timestamp (newest first)
    console.log(`Filtering and sorting ${images.length} processed images`);

    const validImages = images
      .filter((img) => {
        const isValid = img !== null && img.url;
        if (!isValid) {
          console.log(`Filtering out invalid image: ${JSON.stringify(img)}`);
        }
        return isValid;
      })
      .sort((a, b) => {
        if (!a?.timestamp) return 1;
        if (!b?.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    console.log(`Returning ${validImages.length} valid images after filtering`);

    return {
      student: {
        id: booking.contact_id,
        name: booking.full_name.trim(),
        email: booking.email,
        booking: {
          id: booking.id,
          eventId: booking.event_id,
          eventName: booking.event_name,
          gownRfid: booking.rfid,
        },
      },
      images: validImages,
    };
  });

// Query options for fetching student by gown RFID
export const studentByGownRfidQueryOptions = (rfid: string, eventId?: number) =>
  queryOptions({
    queryKey: ['student', 'rfid', rfid, eventId],
    queryFn: () => fetchStudentByGownRfid({ data: { rfid, eventId } }),
    enabled: !!rfid,
  });

// Function to fetch contact images by contact ID
export const fetchContactImages = createServerFn({ method: 'GET' })
  .validator((data: { contactId: number; watermarked?: boolean }) => ({
    contactId: data.contactId,
    watermarked: data.watermarked ?? true,
  }))
  .handler(async (ctx) => {
    const { contactId, watermarked } = ctx.data;
    console.log(`Fetching images for contact ID: ${contactId}, watermarked: ${watermarked}`);
    const supabase = createServerClient();

    // First, fetch the contact information
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError) {
      console.error(`Error fetching contact: ${contactError.message}`);
      throw new Error(`Error fetching contact: ${contactError.message}`);
    }

    if (!contact) {
      throw new Error(`No contact found with ID: ${contactId}`);
    }

    // Fetch event information through bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('event:event(id, name, printing_end_time)')
      .eq('contact', contactId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookingsError) {
      console.error(`Error fetching bookings: ${bookingsError.message}`);
    }

    // Get event details if available
    const eventData =
      bookings && bookings.length > 0 && bookings[0].event ? (bookings[0].event as any) : null;
    console.log(`Event data for contact ID: ${contactId}`, eventData);

    // Check if printing is still available
    const isPrintingAvailable = eventData
      ? isPrintingStillAvailable(eventData.printing_end_time)
      : false;

    // Fetch images for this contact
    const query = supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId);

    const { data: contactImages, error: imagesError } = await query;

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`);
      throw new Error(`Error fetching contact images: ${imagesError.message}`);
    }

    console.log(`Found ${contactImages?.length || 0} images for contact ID: ${contactId}`);

    // Process images to get signed URLs
    const processImage = async (item: any) => {
      try {
        if (!item.image) {
          return null;
        }

        // Determine which path to use based on watermarked flag
        const imagePath = watermarked
          ? item.image.watermarked_image_path || item.image.original_image_path
          : item.image.original_image_path;

        if (!imagePath) {
          return null;
        }

        const bucket = watermarked ? 'watermarked_images' : 'original_images';
        const signedUrl = await getSignedUrl(bucket, imagePath);

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.image?.timestamp || null,
          path: imagePath,
          is_print_ready: item.purchased_print || false,
          purchased_print: item.purchased_print || false,
          print_credits: item.print_credits || 0,
          digital_download: item.digital_download || false,
        };
      } catch (error) {
        console.error(`Error processing image:`, error);
        return null;
      }
    };

    // Process all images with a timeout
    const processImagesWithTimeout = async () => {
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Timeout reached for image processing');
          resolve([]);
        }, 15000); // 15 second timeout
      });

      const processedImagesPromise = Promise.all((contactImages || []).map(processImage));

      return Promise.race([processedImagesPromise, timeoutPromise]);
    };

    const processedImages = await processImagesWithTimeout();

    // Filter out null values and sort by timestamp (newest first)
    const validImages = processedImages
      .filter((img) => img !== null && img.url)
      .sort((a, b) => {
        if (!a?.timestamp) return 1;
        if (!b?.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return {
      contact: {
        id: contact.id,
        name: contact.full_name?.trim() || 'Unknown',
        email: contact.email,
      },
      event: eventData
        ? {
            id: eventData.id,
            name: eventData.name,
            printing_end_time: eventData.printing_end_time,
            is_printing_available: isPrintingAvailable,
          }
        : null,
      images: validImages,
    };
  });

// Function to fetch images for the authenticated user
export const fetchUserImages = createServerFn({ method: 'GET' })
  .validator((data: { watermarked?: boolean }) => ({
    watermarked: data.watermarked ?? false,
  }))
  .handler(async (ctx) => {
    const { watermarked } = ctx.data;
    const supabase = createServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(`Error fetching authenticated user: ${authError?.message || 'No user found'}`);
      throw new Error(`You must be logged in to view your gallery`);
    }

    // Fetch the contact from contacts_with_recent_booking view
    const { data: contact, error: contactError } = await supabase
      .from('contacts_with_recent_booking')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (contactError) {
      console.error(`Error fetching contact: ${contactError.message}`);
      throw new Error(`Error fetching contact: ${contactError.message}`);
    }

    if (!contact) {
      throw new Error(`No contact found for user: ${user.id}`);
    }

    // Check if printing is still available
    const isPrintingAvailable = contact.printing_end_time
      ? isPrintingStillAvailable(contact.printing_end_time)
      : false;

    // Fetch images for this contact
    const query = supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contact.contact_id);

    const { data: contactImages, error: imagesError } = await query;

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`);
      throw new Error(`Error fetching contact images: ${imagesError.message}`);
    }

    console.log(`Found ${contactImages?.length || 0} images for contact ID: ${contact.contact_id}`);

    // Process images to get signed URLs
    const processImage = async (item: any) => {
      try {
        if (!item.image) {
          return null;
        }

        // Determine which path to use based on watermarked flag
        const imagePath = watermarked
          ? item.image.watermarked_image_path || item.image.original_image_path
          : item.image.original_image_path;

        if (!imagePath) {
          return null;
        }

        const bucket = watermarked ? 'watermarked_images' : 'original_images';
        const signedUrl = await getSignedUrl(bucket, imagePath);

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.image?.timestamp || null,
          path: imagePath,
          is_print_ready: item.purchased_print || false,
          purchased_print: item.purchased_print || false,
          print_credits: item.print_credits || 0,
          digital_download: item.purchased_download || false,
        };
      } catch (error) {
        console.error(`Error processing image:`, error);
        return null;
      }
    };

    // Process all images with a timeout
    const processImagesWithTimeout = async () => {
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Timeout reached for image processing');
          resolve([]);
        }, 15000); // 15 second timeout
      });

      const processedImagesPromise = Promise.all((contactImages || []).map(processImage));

      return Promise.race([processedImagesPromise, timeoutPromise]);
    };

    const processedImages = await processImagesWithTimeout();

    // Filter out null values and sort by timestamp (newest first)
    const validImages = processedImages
      .filter((img) => img !== null && img.url)
      .sort((a, b) => {
        if (!a?.timestamp) return 1;
        if (!b?.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return {
      user: {
        id: contact.contact_id, // Use contact_id instead of user.id
        name: contact.full_name?.trim() || 'Unknown',
        email: contact.email,
      },
      event: {
        id: contact.event_id,
        name: contact.event_name,
        printing_end_time: contact.printing_end_time,
        is_printing_available: isPrintingAvailable,
      },
      images: validImages,
    };
  });

// Function to fetch contact images using the contact data from the layout route
export const fetchContactImagesWithContactData = createServerFn({ method: 'GET' })
  .validator((data: { contactId: number; watermarked?: boolean }) => ({
    contactId: data.contactId,
    watermarked: data.watermarked ?? false,
  }))
  .handler(async (ctx) => {
    const { contactId, watermarked } = ctx.data;
    const supabase = createServerClient();

    // Check if printing is still available
    const { data: contact, error: contactError } = await supabase
      .from('contacts_with_recent_booking')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (contactError) {
      console.error(`Error fetching contact: ${contactError.message}`);
      throw new Error(`Error fetching contact: ${contactError.message}`);
    }

    if (!contact) {
      throw new Error(`No contact found with ID: ${contactId}`);
    }

    const isPrintingAvailable = contact.printing_end_time
      ? isPrintingStillAvailable(contact.printing_end_time)
      : false;

    // Fetch images for this contact
    const query = supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId);

    const { data: contactImages, error: imagesError } = await query;

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`);
      throw new Error(`Error fetching contact images: ${imagesError.message}`);
    }

    console.log(`Found ${contactImages?.length || 0} images for contact ID: ${contactId}`);

    // Process images to get signed URLs
    const processImage = async (item: any) => {
      try {
        if (!item.image) {
          return null;
        }

        // Determine which path to use based on watermarked flag
        const imagePath = watermarked
          ? item.image.watermarked_image_path || item.image.original_image_path
          : item.image.original_image_path;

        if (!imagePath) {
          return null;
        }

        const bucket = watermarked ? 'watermarked_images' : 'original_images';
        const signedUrl = await getSignedUrl(bucket, imagePath);

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.image?.timestamp || null,
          path: imagePath,
          is_print_ready: item.purchased_print || false,
          purchased_print: item.purchased_print || false,
          print_credits: item.print_credits || 0,
          digital_download: item.purchased_download || false,
        };
      } catch (error) {
        console.error(`Error processing image:`, error);
        return null;
      }
    };

    // Process all images with a timeout
    const processImagesWithTimeout = async () => {
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Timeout reached for image processing');
          resolve([]);
        }, 15000); // 15 second timeout
      });

      const processedImagesPromise = Promise.all((contactImages || []).map(processImage));

      return Promise.race([processedImagesPromise, timeoutPromise]);
    };

    const processedImages = await processImagesWithTimeout();

    // Filter out null values and sort by timestamp (newest first)
    const validImages = processedImages
      .filter((img) => img !== null && img.url)
      .sort((a, b) => {
        if (!a?.timestamp) return 1;
        if (!b?.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return {
      user: {
        id: contact.contact_id,
        name: contact.full_name?.trim() || 'Unknown',
        email: contact.email,
      },
      event: {
        id: contact.event_id,
        name: contact.event_name,
        printing_end_time: contact.printing_end_time,
        is_printing_available: isPrintingAvailable,
      },
      images: validImages,
    };
  });

// Query options for fetching contact images with contact data
export const contactImagesQueryOptions = (contactId: number, watermarked: boolean = false) =>
  queryOptions({
    queryKey: ['contact', 'images', contactId, watermarked],
    queryFn: () => fetchContactImagesWithContactData({ data: { contactId, watermarked } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Function to fetch student gallery images that respects purchased status
export const fetchStudentGalleryImages = createServerFn({ method: 'GET' })
  .validator((data: { contactId: number }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    const supabase = createServerClient();

    // Check if printing is still available
    const { data: contact, error: contactError } = await supabase
      .from('contacts_with_recent_booking')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (contactError) {
      console.error(`Error fetching contact: ${contactError.message}`);
      throw new Error(`Error fetching contact: ${contactError.message}`);
    }

    if (!contact) {
      throw new Error(`No contact found with ID: ${contactId}`);
    }

    const isPrintingAvailable = contact.printing_end_time
      ? isPrintingStillAvailable(contact.printing_end_time)
      : false;

    // Fetch images for this contact
    const query = supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId);

    const { data: contactImages, error: imagesError } = await query;

    if (imagesError) {
      console.error(`Error fetching contact images: ${imagesError.message}`);
      throw new Error(`Error fetching contact images: ${imagesError.message}`);
    }

    console.log(`Found ${contactImages?.length || 0} images for contact ID: ${contactId}`);

    // Process images to get signed URLs
    const processImage = async (item: any) => {
      try {
        if (!item.image) {
          return null;
        }

        // Determine which path to use based on purchased status
        // If purchased_download is true, use original image, otherwise use watermarked
        const isPurchased = item.purchased_download || false;
        const imagePath = isPurchased
          ? item.image.original_image_path
          : item.image.watermarked_image_path || item.image.original_image_path;

        if (!imagePath) {
          return null;
        }

        const bucket = isPurchased ? 'original_images' : 'watermarked_images';
        const signedUrl = await getSignedUrl(bucket, imagePath);

        return {
          id: item.image_id,
          url: signedUrl || '',
          timestamp: item.image?.timestamp || null,
          path: imagePath,
          is_print_ready: item.purchased_print || false,
          purchased_print: item.purchased_print || false,
          print_credits: item.print_credits || 0,
          digital_download: item.purchased_download || false,
          isPurchased: isPurchased,
          originalImagePath: item.image.original_image_path,
          watermarkedImagePath: item.image.watermarked_image_path,
        };
      } catch (error) {
        console.error(`Error processing image:`, error);
        return null;
      }
    };

    // Process all images with a timeout
    const processImagesWithTimeout = async () => {
      const timeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          console.log('Timeout reached for image processing');
          resolve([]);
        }, 15000); // 15 second timeout
      });

      const processedImagesPromise = Promise.all((contactImages || []).map(processImage));

      return Promise.race([processedImagesPromise, timeoutPromise]);
    };

    const processedImages = await processImagesWithTimeout();

    // Filter out null values and sort by timestamp (newest first)
    const validImages = processedImages
      .filter((img) => img !== null && img.url)
      .sort((a, b) => {
        if (!a?.timestamp) return 1;
        if (!b?.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    return {
      user: {
        id: contact.contact_id,
        name: contact.full_name?.trim() || 'Unknown',
        email: contact.email,
      },
      event: {
        id: contact.event_id,
        name: contact.event_name,
        printing_end_time: contact.printing_end_time,
        is_printing_available: isPrintingAvailable,
      },
      images: validImages,
    };
  });

// Query options for fetching student gallery images
export const studentGalleryImagesQueryOptions = (contactId: number) =>
  queryOptions({
    queryKey: ['student', 'gallery', 'images', contactId],
    queryFn: () => fetchStudentGalleryImages({ data: { contactId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Function to download a purchased image
export const downloadPurchasedImage = createServerFn({ method: 'GET' })
  .validator((data: { imageId: string; contactId: number }) => ({
    imageId: data.imageId,
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { imageId, contactId } = ctx.data;
    const supabase = createServerClient();

    // Verify that the image belongs to the contact and is purchased
    const { data: contactImage, error: contactImageError } = await supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId)
      .eq('image_id', imageId)
      .single();

    if (contactImageError) {
      console.error(`Error fetching contact image: ${contactImageError.message}`);
      throw new Error(`Error fetching image: ${contactImageError.message}`);
    }

    if (!contactImage) {
      throw new Error(`Image not found or not associated with your account`);
    }

    // Check if the image is purchased
    if (!contactImage.purchased_download) {
      throw new Error(`You have not purchased this image for download`);
    }

    // Get the original image path
    const originalImagePath = contactImage.image?.original_image_path;
    if (!originalImagePath) {
      throw new Error(`Original image not found`);
    }

    // Get a signed URL for the original image
    const signedUrl = await getSignedUrl('original_images', originalImagePath);
    if (!signedUrl) {
      throw new Error(`Failed to generate download link`);
    }

    return {
      url: signedUrl,
      filename: originalImagePath.split('/').pop() || `image-${imageId}.jpg`,
    };
  });

// Function to download multiple purchased images as a zip
export const downloadMultiplePurchasedImages = createServerFn({ method: 'GET' })
  .validator((data: { imageIds: string[]; contactId: number }) => ({
    imageIds: data.imageIds,
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { imageIds, contactId } = ctx.data;
    const supabase = createServerClient();

    if (!imageIds.length) {
      throw new Error('No images selected for download');
    }

    // Verify that all images belong to the contact and are purchased
    const { data: contactImages, error: contactImagesError } = await supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId)
      .in('image_id', imageIds);

    if (contactImagesError) {
      console.error(`Error fetching contact images: ${contactImagesError.message}`);
      throw new Error(`Error fetching images: ${contactImagesError.message}`);
    }

    if (!contactImages || contactImages.length === 0) {
      throw new Error(`No images found or not associated with your account`);
    }

    // Filter to only purchased images
    const purchasedImages = contactImages.filter((img) => img.purchased_download);

    if (purchasedImages.length === 0) {
      throw new Error(`None of the selected images have been purchased for download`);
    }

    // Get signed URLs for all purchased images
    const downloadUrls = await Promise.all(
      purchasedImages.map(async (img) => {
        const originalImagePath = img.image?.original_image_path;
        if (!originalImagePath) return null;

        const signedUrl = await getSignedUrl('original_images', originalImagePath);
        if (!signedUrl) return null;

        return {
          id: img.image_id,
          url: signedUrl,
          filename: originalImagePath.split('/').pop() || `image-${img.image_id}.jpg`,
        };
      })
    );

    // Filter out any null values
    const validDownloadUrls = downloadUrls.filter((url) => url !== null);

    if (validDownloadUrls.length === 0) {
      throw new Error(`Failed to generate download links`);
    }

    return {
      images: validDownloadUrls,
      count: validDownloadUrls.length,
    };
  });
