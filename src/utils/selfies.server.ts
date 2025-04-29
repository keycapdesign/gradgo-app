import { createServerFn } from '@tanstack/react-start';
import type { SelfieRecord } from './selfies.types';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Server function to fetch the selfie record for a contact (by contact_id).
 */
export const fetchSelfieForContact = createServerFn({ method: 'GET' })
  .validator((data: { contactId: number }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    if (!contactId) {
      console.error('fetchSelfieForContact called with invalid contactId:', contactId);
      return null;
    }
    const supabase = createServerClient();
    try {
      const { data: selfie, error } = await supabase
        .from('selfies')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching selfie:', error);
        throw error;
      }
      return selfie ?? null;
    } catch (err) {
      console.error('Error in fetchSelfieForContact:', err);
      throw err;
    }
  });

// Removed uploadSelfieWithUserId from server functions: use the client version for browser uploads.

/**
 * Server function to upsert a selfie record for a contact/user
 */
export const upsertSelfie = createServerFn({ method: 'POST' })
  .validator((data: SelfieRecord) => data)
  .handler(async (ctx) => {
    const { contact_id, user_id, path, offset_x, offset_y, scale } = ctx.data;
    if (!contact_id) {
      throw new Error('contact_id is required for upserting selfie');
    }
    if (!path) {
      throw new Error('path is required for upserting selfie');
    }
    const normalizedOffsetX = typeof offset_x === 'number' ? offset_x : 0;
    const normalizedOffsetY = typeof offset_y === 'number' ? offset_y : 0;
    const normalizedScale = typeof scale === 'number' ? scale : 1;
    const supabase = createServerClient();
    const { data, error } = await supabase.from('selfies').upsert(
      {
        contact_id,
        user_id,
        path,
        offset_x: normalizedOffsetX,
        offset_y: normalizedOffsetY,
        scale: normalizedScale,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'contact_id',
      }
    );
    if (error) {
      console.error('Error upserting selfie:', error);
      throw error;
    }
    return data;
  });

/**
 * Returns TanStack Query options for fetching a selfie record for a contact.
 * Usage: useSuspenseQuery(selfieQueryOptions(contactId))
 */
export function selfieQueryOptions(contactId: number | null | undefined) {
  return {
    queryKey: ['selfie', contactId],
    queryFn: () =>
      fetchSelfieForContact({
        data: { contactId: contactId as number },
      }),
    enabled: !!contactId,
    staleTime: 60 * 1000, // 1 minute
  };
}
