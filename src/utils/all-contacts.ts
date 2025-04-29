import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch contacts with bookings (paginated)
export const fetchContactsWithBookings = createServerFn({ method: 'GET' })
  .validator(
    (data: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      search?: string;
      order_type?: string | null;
      event_id?: string | null;
    }) => ({
      page: data.page || 1,
      pageSize: data.pageSize || 25,
      sortBy: data.sortBy || 'contact_created_at',
      sortDirection: data.sortDirection || 'desc',
      search: data.search || '',
      order_type: data.order_type || null,
      event_id: data.event_id || null,
    })
  )
  .handler(async (ctx) => {
    const { page, pageSize, sortBy, sortDirection, search, order_type, event_id } = ctx.data;
    console.log('Fetching contacts with bookings:', {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
      order_type,
      event_id,
    });
    const supabase = createServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build the base query
    let query = supabase
      .from('contacts_with_recent_booking')
      .select('*, gown(*), event_id(*)', { count: 'exact' });

    // Add search if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply order_type filter if provided
    if (order_type) {
      query = query.eq('order_type', order_type);
    }

    // Apply event_id filter if provided
    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    // Get the total count
    const { count, error: countError } = await query;

    if (countError) {
      console.error(`Error fetching contacts count: ${countError.message}`);
      throw new Error(`Error fetching contacts count: ${countError.message}`);
    }

    // Then get the paginated and sorted contacts
    console.log('Sorting by:', sortBy, 'direction:', sortDirection);
    const { data: contacts, error: contactsError } = await query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(from, to);

    if (contactsError) {
      console.error(`Error fetching contacts: ${contactsError.message}`);
      throw new Error(`Error fetching contacts: ${contactsError.message}`);
    }

    return {
      data: contacts || [],
      totalCount: count || 0,
      page,
      pageSize,
    };
  });

// Query options for contacts with bookings
export const contactsWithBookingsQueryOptions = (
  page: number = 1,
  pageSize: number = 25,
  sortBy: string = 'contact_created_at',
  sortDirection: 'asc' | 'desc' = 'desc',
  search: string = '',
  order_type: string | null = null,
  event_id: string | null = null
) =>
  queryOptions({
    queryKey: [
      'contacts',
      'with-bookings',
      { page, pageSize, sortBy, sortDirection, search, order_type, event_id },
    ],
    queryFn: () =>
      fetchContactsWithBookings({
        data: { page, pageSize, sortBy, sortDirection, search, order_type, event_id },
      }),
  });
