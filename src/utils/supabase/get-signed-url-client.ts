import { createClient } from '@/utils/supabase/client';

/**
 * Generate a signed URL for a file in Supabase storage (client-side version)
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL or null if there was an error
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  if (!path) {
    console.warn('getSignedUrl called with empty path');
    return null;
  }

  // Handle paths that might already include the bucket name or have a different prefix
  // Example: "images/path/to/file.jpg" -> extract just "path/to/file.jpg"
  // Example: "watermarked_images/file.jpg" -> should be just "file.jpg" when bucket is "images"
  let cleanPath = path;

  // Check if path starts with bucket name
  const bucketPrefix = `${bucket}/`;
  if (path.startsWith(bucketPrefix)) {
    cleanPath = path.substring(bucketPrefix.length);
    console.log(`Path starts with bucket name, cleaned: ${path} -> ${cleanPath}`);
  }
  // Special case for watermarked_images prefix
  else if (path.startsWith('watermarked_images/')) {
    cleanPath = path.substring('watermarked_images/'.length);
    console.log(`Path starts with watermarked_images/, cleaned: ${path} -> ${cleanPath}`);
  }

  // For watermarked_images bucket, make sure we don't have a redundant prefix
  if (bucket === 'watermarked_images' && cleanPath.startsWith('watermarked_images/')) {
    cleanPath = cleanPath.substring('watermarked_images/'.length);
    console.log(`Removed redundant watermarked_images/ prefix: ${cleanPath}`);
  }

  // Check for common path issues
  if (cleanPath.startsWith('/')) {
    console.log(`Removing leading slash from path: ${cleanPath}`);
    cleanPath = cleanPath.substring(1);
  }

  // Log the path being processed
  console.log(
    `[CLIENT] Processing path for signed URL - Bucket: ${bucket}, Original: ${path}, Clean: ${cleanPath}`
  );

  try {
    const supabase = createClient();

    // Verify that the Supabase client was created successfully
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return null;
    }

    // Verify that the storage API is available
    if (!supabase.storage) {
      console.error('Supabase storage API not available');
      return null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      console.error(`[CLIENT] Error generating signed URL for ${bucket}/${cleanPath}:`, error);
      return null;
    }

    if (!data || !data.signedUrl) {
      console.error(`[CLIENT] No signed URL returned for ${bucket}/${cleanPath}`);
      return null;
    }

    console.log(
      `[CLIENT] Successfully generated signed URL for ${bucket}/${cleanPath}: ${data.signedUrl.substring(0, 50)}...`
    );
    return data.signedUrl;
  } catch (error) {
    console.error(`[CLIENT] Exception generating signed URL for ${bucket}/${cleanPath}:`, error);
    return null;
  }
}

/**
 * Generate signed URLs for multiple files in Supabase storage (client-side version)
 * @param bucket The storage bucket name
 * @param paths Array of file paths within the bucket
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object mapping paths to their signed URLs
 */
export async function getSignedUrls(bucket: string, paths: string[], expiresIn: number = 3600) {
  if (!paths.length) return {};

  try {
    const supabase = createClient();
    const bucketPrefix = `${bucket}/`;

    const results = await Promise.all(
      paths.map(async (path) => {
        // Handle paths that might already include the bucket name or have a different prefix
        let cleanPath = path;

        // Check if path starts with bucket name
        if (path.startsWith(bucketPrefix)) {
          cleanPath = path.substring(bucketPrefix.length);
        }
        // Special case for watermarked_images prefix
        else if (path.startsWith('watermarked_images/')) {
          cleanPath = path.substring('watermarked_images/'.length);
        }

        console.log(
          `Batch processing path - Bucket: ${bucket}, Original: ${path}, Clean: ${cleanPath}`
        );

        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(cleanPath, expiresIn);

        return { path, url: error ? null : data?.signedUrl };
      })
    );

    return results.reduce(
      (acc, { path, url }) => {
        if (url) acc[path] = url;
        return acc;
      },
      {} as Record<string, string>
    );
  } catch (error) {
    console.error(`Exception generating signed URLs for ${bucket}:`, error);
    return {};
  }
}
