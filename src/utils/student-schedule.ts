import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch schedule items for an event
export const fetchEventScheduleItems = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching schedule items for event ${eventId}`);
    const supabase = createServerClient();

    // Fetch schedule items
    const { data: scheduleItems, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(`Error fetching schedule items: ${error.message}`);
      throw new Error(`Error fetching schedule items: ${error.message}`);
    }

    console.log(`Found ${scheduleItems?.length || 0} schedule items for event ${eventId}`);

    return scheduleItems || [];
  });

// Query options for event schedule items
export const eventScheduleItemsQueryOptions = (eventId: number | null | undefined) =>
  queryOptions({
    queryKey: ['event', eventId, 'scheduleItems'],
    queryFn: () => {
      if (!eventId) {
        return Promise.resolve([]);
      }
      return fetchEventScheduleItems({ data: { eventId } });
    },
    enabled: !!eventId,
  });
