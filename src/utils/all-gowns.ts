import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch gowns with latest booking (paginated)
export const fetchGownsWithLatestBooking = createServerFn({ method: 'GET' })
  .validator(
    (data: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      search?: string;
    }) => ({
      page: data.page || 1,
      pageSize: data.pageSize || 25,
      sortBy: data.sortBy || 'check_out_time',
      sortDirection: data.sortDirection || 'desc',
      search: data.search || '',
    })
  )
  .handler(async (ctx) => {
    const { page, pageSize, sortBy, sortDirection, search } = ctx.data;
    console.log('Fetching gowns with latest booking:', {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
    });
    const supabase = createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build the base query
    let query = supabase.from('gowns_with_latest_booking').select('*', { count: 'exact' });

    // Add search if provided
    if (search) {
      query = query.or(`ean.ilike.%${search}%,rfid.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Get the total count
    const { count, error: countError } = await query;

    if (countError) {
      console.error(`Error fetching gowns count: ${countError.message}`);
      throw new Error(`Error fetching gowns count: ${countError.message}`);
    }

    // Then get the paginated and sorted gowns
    console.log('Sorting by:', sortBy, 'direction:', sortDirection);
    const { data: gowns, error: gownsError } = await query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(from, to);

    if (gownsError) {
      console.error(`Error fetching gowns: ${gownsError.message}`);
      throw new Error(`Error fetching gowns: ${gownsError.message}`);
    }

    return {
      data: gowns || [],
      totalCount: count || 0,
      page,
      pageSize,
    };
  });

// Query options for gowns with latest booking
export const gownsWithLatestBookingQueryOptions = (
  page: number = 1,
  pageSize: number = 25,
  sortBy: string = 'check_out_time',
  sortDirection: 'asc' | 'desc' = 'desc',
  search: string = ''
) =>
  queryOptions({
    queryKey: ['gowns', 'with-latest-booking', { page, pageSize, sortBy, sortDirection, search }],
    queryFn: () =>
      fetchGownsWithLatestBooking({
        data: { page, pageSize, sortBy, sortDirection, search },
      }),
  });
