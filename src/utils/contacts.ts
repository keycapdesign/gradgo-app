import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { getSignedUrl } from '@/utils/supabase/get-signed-url';

// Server function to fetch contact by ID
export const fetchContactById = createServerFn({ method: 'GET' })
  .validator((data: { contactId: string }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    console.log(`Fetching contact ${contactId}`);
    const supabase = createServerClient();

    // Fetch contact details
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) {
      console.error(`Error fetching contact: ${error.message}`);
      if (error.code === 'PGRST116') {
        throw notFound();
      }
      throw new Error(`Error fetching contact: ${error.message}`);
    }

    console.log(`Found contact ${contactId}:`, {
      id: contact.id,
      name: contact.full_name,
      selfie_path: contact.selfie_path,
    });

    // Generate signed URL for selfie if it exists
    if (contact && contact.selfie_path) {
      console.log(`Getting signed URL for selfie with path ${contact.selfie_path}`);

      // Try to get signed URL from the face_id_images bucket
      const signedUrl = await getSignedUrl('face_id_images', contact.selfie_path);

      if (signedUrl) {
        contact.selfieSignedUrl = signedUrl;
        console.log(`Got signed URL for selfie`);
      } else {
        console.error(`Failed to get signed URL for selfie with path ${contact.selfie_path}`);
      }
    }

    return contact;
  });

// Server function to fetch contact images
export const fetchContactImages = createServerFn({ method: 'GET' })
  .validator((data: { contactId: string }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    console.log(`Fetching images for contact ${contactId}`);
    const supabase = createServerClient();

    // Fetch contact images
    const { data: images, error } = await supabase
      .from('contact_images')
      .select('*, image:image_id(*)')
      .eq('contact_id', contactId);

    if (error) {
      console.error(`Error fetching contact images: ${error.message}`);
      throw new Error(`Error fetching contact images: ${error.message}`);
    }

    console.log(`Found ${images?.length || 0} images for contact ${contactId}`);

    // Log the image paths for debugging
    if (images && images.length > 0) {
      console.log('Image paths:');
      images.forEach((imageData, index) => {
        if (imageData.image) {
          console.log(`Image ${index + 1}:`, {
            id: imageData.id,
            image_id: imageData.image_id,
            watermarked_path: imageData.image.watermarked_image_path,
            original_path: imageData.image.original_image_path,
          });
        } else {
          console.log(`Image ${index + 1}: No image data`, imageData);
        }
      });
    }

    // Generate signed URLs for each image
    if (images && images.length > 0) {
      for (const imageData of images) {
        if (imageData.image?.watermarked_image_path) {
          console.log(
            `Getting signed URL for image ${imageData.id} with path ${imageData.image.watermarked_image_path}`
          );

          // Only use the watermarked_images bucket
          const signedUrl = await getSignedUrl(
            'watermarked_images',
            imageData.image.watermarked_image_path
          );

          if (signedUrl) {
            imageData.signedUrl = signedUrl;
            console.log(`Got signed URL for image ${imageData.id}`);
          } else {
            console.error(
              `Failed to get signed URL for image ${imageData.id} with path ${imageData.image.watermarked_image_path}`
            );
          }
        } else {
          console.error(`Missing watermarked_image_path for image ${imageData.id}`);
        }
      }
    }

    return images;
  });

// Server function to fetch contact bookings
export const fetchContactBookings = createServerFn({ method: 'GET' })
  .validator((data: { contactId: string }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    console.log(`Fetching bookings for contact ${contactId}`);
    const supabase = createServerClient();

    // Fetch contact bookings
    const { data: bookings, error } = await supabase
      .from('distinct_contact_bookings')
      .select('*, event(*), gown(*)')
      .eq('contact', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching contact bookings: ${error.message}`);
      throw new Error(`Error fetching contact bookings: ${error.message}`);
    }

    console.log(`Found ${bookings?.length || 0} bookings for contact ${contactId}`);

    return bookings;
  });

// Server function to fetch all images in a date range
export const fetchUnassociatedImages = createServerFn({ method: 'GET' })
  .validator(
    (data: { contactId: string; dateRange?: string[]; page?: number; pageSize?: number }) => ({
      contactId: data.contactId,
      dateRange: data.dateRange,
      page: data.page || 0,
      pageSize: data.pageSize || 12,
    })
  )
  .handler(async (ctx) => {
    const { contactId, dateRange, page, pageSize } = ctx.data;
    console.log(`Fetching images for contact ${contactId}`);
    console.log('Raw dateRange from request:', JSON.stringify(dateRange));

    // Validate the date range
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      console.log('Valid date range format received:', dateRange);
    } else {
      console.warn('Invalid or missing date range format:', dateRange);
    }

    const supabase = createServerClient();

    // Calculate offset based on page and pageSize
    const offset = page * pageSize;

    // First, get the IDs of images already associated with this contact
    const { data: contactImages, error: contactImagesError } = await supabase
      .from('contact_images')
      .select('image_id')
      .eq('contact_id', parseInt(contactId));

    if (contactImagesError) {
      console.error(`Error fetching contact images: ${contactImagesError.message}`);
      throw new Error(`Error fetching contact images: ${contactImagesError.message}`);
    }

    // Extract the image IDs into a Set for faster lookups
    const associatedImageIds = new Set(contactImages?.map((item) => item.image_id) || []);
    console.log(`Found ${associatedImageIds.size} associated images`);

    // Build the query for all images in the date range
    let query = supabase.from('images').select('*', { count: 'exact' });

    // Add date range filtering if dateRange is provided
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      // Log the date range for debugging
      console.log(`Filtering by date range: ${dateRange[0]} to ${dateRange[1]}`);

      try {
        // The images table has a 'timestamp' column according to the database schema
        // Make sure we're using the correct format for the timestamp
        // Supabase expects ISO 8601 format for timestamp filtering
        // We'll use the raw strings since they should already be in ISO format
        const startTimestamp = dateRange[0];
        const endTimestamp = dateRange[1];

        console.log(`Filtering by timestamp range: ${startTimestamp} to ${endTimestamp}`);

        // Apply the filter to the query
        query = query.gte('timestamp', startTimestamp).lte('timestamp', endTimestamp);

        // Log the SQL query for debugging (if possible)
        console.log('Query with date range filter applied');
      } catch (error) {
        console.error('Error applying date range filter:', error);
      }
    } else {
      console.log('No date range provided for filtering');
    }

    // Execute the query with pagination
    const {
      data: images,
      error,
      count,
    } = await query.order('timestamp', { ascending: false }).range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Error fetching images: ${error.message}`);
      throw new Error(`Error fetching images: ${error.message}`);
    }

    console.log(`Found ${images?.length || 0} images out of ${count || 0} total`);

    // Mark images as associated or not
    const processedImages =
      images?.map((image) => ({
        ...image,
        isAssociated: associatedImageIds.has(image.id),
      })) || [];

    // Generate signed URLs for each image
    if (processedImages.length > 0) {
      console.log(`Processing ${processedImages.length} images`);
      for (const image of processedImages) {
        if (image.watermarked_image_path) {
          console.log(`Getting signed URL for image with path ${image.watermarked_image_path}`);

          // Only use the watermarked_images bucket
          const signedUrl = await getSignedUrl('watermarked_images', image.watermarked_image_path);

          if (signedUrl) {
            image.signedUrl = signedUrl;
            console.log(`Got signed URL for image ${image.id}`);
          } else {
            console.error(
              `Failed to get signed URL for image with path ${image.watermarked_image_path}`
            );
          }
        } else {
          console.error(`Missing watermarked_image_path for image:`, image.id);
        }
      }
    }

    return {
      images: processedImages,
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  });

// Server function to relate an image to a contact
export const relateImageToContact = createServerFn({ method: 'POST' })
  .validator((data: { contactId: string; imageId: string }) => ({
    contactId: data.contactId,
    imageId: data.imageId,
  }))
  .handler(async (ctx) => {
    const { contactId, imageId } = ctx.data;
    console.log(`Relating image ${imageId} to contact ${contactId}`);
    const supabase = createServerClient();

    // Create a new contact_images record
    const { data, error } = await supabase
      .from('contact_images')
      .insert({
        contact_id: parseInt(contactId),
        image_id: imageId,
      })
      .select();

    if (error) {
      console.error(`Error relating image to contact: ${error.message}`);
      throw new Error(`Error relating image to contact: ${error.message}`);
    }

    return data;
  });

// Server function to unrelate an image from a contact
export const unrelateImageFromContact = createServerFn({ method: 'POST' })
  .validator((data: { contactId: string; imageId: string }) => ({
    contactId: data.contactId,
    imageId: data.imageId,
  }))
  .handler(async (ctx) => {
    const { contactId, imageId } = ctx.data;
    console.log(`Unrelating image ${imageId} from contact ${contactId}`);
    const supabase = createServerClient();

    // Delete the contact_images record
    const { data, error } = await supabase
      .from('contact_images')
      .delete()
      .eq('contact_id', parseInt(contactId))
      .eq('image_id', imageId)
      .select();

    if (error) {
      console.error(`Error unrelating image from contact: ${error.message}`);
      throw new Error(`Error unrelating image from contact: ${error.message}`);
    }

    return data;
  });

// Query options for contact details
export const contactQueryOptions = (contactId: string) =>
  queryOptions({
    queryKey: ['contact', contactId],
    queryFn: () => fetchContactById({ data: { contactId } }),
  });

// Query options for contact images
export const contactImagesQueryOptions = (contactId: string) =>
  queryOptions({
    queryKey: ['contact', contactId, 'images'],
    queryFn: () => fetchContactImages({ data: { contactId } }),
  });

// Query options for contact bookings
export const contactBookingsQueryOptions = (contactId: string) =>
  queryOptions({
    queryKey: ['contact', contactId, 'bookings'],
    queryFn: () => fetchContactBookings({ data: { contactId } }),
  });

// Query options for images with association status
export const unassociatedImagesQueryOptions = (
  contactId: string,
  dateRange?: [Date | undefined, Date | undefined],
  page: number = 0,
  pageSize: number = 12
) => {
  // Format the date range for the query
  let formattedDateRange: string[] | undefined = undefined;

  console.log('Raw date range in unassociatedImagesQueryOptions:', dateRange);

  if (dateRange && dateRange[0] && dateRange[1]) {
    // Make sure both dates are valid
    if (!isNaN(dateRange[0].getTime()) && !isNaN(dateRange[1].getTime())) {
      formattedDateRange = [dateRange[0].toISOString(), dateRange[1].toISOString()];
      console.log('Formatted date range for query:', formattedDateRange);
    } else {
      console.error('Invalid date objects in date range:', {
        start: dateRange[0],
        end: dateRange[1],
        startValid: dateRange[0] ? !isNaN(dateRange[0].getTime()) : false,
        endValid: dateRange[1] ? !isNaN(dateRange[1].getTime()) : false,
      });
    }
  } else {
    console.log('No valid date range provided for query');
  }

  return queryOptions({
    queryKey: ['contact', contactId, 'images', { dateRange: formattedDateRange, page, pageSize }],
    queryFn: () =>
      fetchUnassociatedImages({
        data: {
          contactId,
          dateRange: formattedDateRange,
          page,
          pageSize,
        },
      }),
    enabled: false, // Don't fetch on mount, only when search is triggered
  });
};
