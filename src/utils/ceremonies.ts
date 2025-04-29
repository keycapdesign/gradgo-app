import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Define the Ceremony type
export interface Ceremony {
  id: number;
  name: string;
  event: number;
  datetime?: string;
  external_id?: number;
}

/**
 * Fetch ceremonies for an event
 */
export const fetchEventCeremonies = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching ceremonies for event: ${eventId}`);
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('ceremonies')
      .select('*')
      .eq('event', eventId)
      .order('datetime', { ascending: true });

    if (error) {
      console.error(`Error fetching ceremonies: ${error.message}`);
      throw new Error(`Error fetching ceremonies: ${error.message}`);
    }

    return data || [];
  });

/**
 * Query options for event ceremonies
 */
export const eventCeremoniesQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'ceremonies'],
    queryFn: () => fetchEventCeremonies({ data: { eventId } }),
    enabled: !!eventId,
  });
