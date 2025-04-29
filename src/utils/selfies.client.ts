import type { SelfieRecord } from './selfies.types';
import { createClient } from '@/utils/supabase/client';


/**
 * Upload a selfie file to Supabase storage with the user ID as the filename
 * @param file The file to upload
 * @param userId The user ID to use as the filename
 * @returns The path of the uploaded file
 */
export async function uploadSelfieWithUserId(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}.${fileExt}`;

  const { data, error } = await supabase.storage.from('face_id_images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  return filePath;
}

/**
 * Upsert a selfie record for a contact/user.
 */
export async function upsertSelfie({
  contact_id,
  user_id,
  path,
  offset_x,
  offset_y,
  scale,
}: SelfieRecord): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('selfies').upsert(
    [
      {
        contact_id,
        user_id,
        path,
        offset_x,
        offset_y,
        scale,
      },
    ],
    { onConflict: 'contact_id' }
  );
  if (error) {
    throw error;
  }
}
