import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch all events
export const fetchAllEvents = createServerFn({ method: 'GET' })
  .validator((data: { sortBy?: string; sortDirection?: 'asc' | 'desc'; search?: string }) => ({
    sortBy: data.sortBy || 'datetime',
    sortDirection: data.sortDirection || 'desc',
    search: data.search || '',
  }))
  .handler(async (ctx) => {
    const { sortBy, sortDirection, search } = ctx.data;
    console.log('Fetching all events with params:', { sortBy, sortDirection, search });
    const supabase = createServerClient();

    // Build the base query
    let query = supabase.from('events').select('*, organization(*)');

    // Add search if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%`);
    }

    // Get all events with sorting
    const { data: events, error } = await query.order(sortBy, {
      ascending: sortDirection === 'asc',
    });

    if (error) {
      console.error(`Error fetching all events: ${error.message}`);
      throw new Error(`Error fetching all events: ${error.message}`);
    }

    return events || [];
  });

// Query options for all events
export const allEventsQueryOptions = (
  sortBy: string = 'datetime',
  sortDirection: 'asc' | 'desc' = 'desc',
  search: string = ''
) =>
  queryOptions({
    queryKey: ['events', 'all', { sortBy, sortDirection, search }],
    queryFn: () =>
      fetchAllEvents({
        data: { sortBy, sortDirection, search },
      }),
  });

// Server function to fetch active events
export const fetchActiveEvents = createServerFn({ method: 'GET' }).handler(async () => {
  console.log('Fetching active events');
  const supabase = createServerClient();

  const { data, error } = await supabase.from('events').select('*').eq('is_active', true);

  if (error) {
    console.error(`Error fetching active events: ${error.message}`);
    throw new Error(`Error fetching active events: ${error.message}`);
  }

  return data || [];
});

// Query options for active events
export const activeEventsQueryOptions = () =>
  queryOptions({
    queryKey: ['events', 'active'],
    queryFn: () => fetchActiveEvents(),
  });
