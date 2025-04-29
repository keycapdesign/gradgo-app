import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

export interface Ceremony {
  id: number;
  name: string;
  datetime?: string;
  event_id: number;
}

// Server function to fetch booking statistics for an event
export const fetchBookingStats = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching booking statistics for event: ${eventId}`);
    const supabase = createServerClient();

    // Call the RPC function to get booking counts
    const { data, error } = await supabase.rpc('get_booking_counts', { p_event: eventId });

    if (error) {
      console.error(`Error fetching booking statistics: ${error.message}`);
      throw new Error(`Error fetching booking statistics: ${error.message}`);
    }

    return data || {};
  });

// Server function to fetch detailed gown statistics for an event
export const fetchDetailedGownStats = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching detailed gown statistics for event: ${eventId}`);
    const supabase = createServerClient();

    // Call the RPC function to get detailed gown counts
    const { data, error } = await supabase.rpc('get_detailed_gown_counts', { p_event: eventId });

    if (error) {
      console.error(`Error fetching detailed gown statistics: ${error.message}`);
      throw new Error(`Error fetching detailed gown statistics: ${error.message}`);
    }
    console.log(data);
    return data || {};
  });

// Query options for booking statistics
export const bookingStatsQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'bookingStats'],
    queryFn: () => fetchBookingStats({ data: { eventId } }),
    enabled: !!eventId,
  });

// Query options for detailed gown statistics
export const detailedGownStatsQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'detailedGownStats'],
    queryFn: () => fetchDetailedGownStats({ data: { eventId } }),
    enabled: !!eventId,
  });

// Server function to fetch bookings for an event
export const fetchEventBookings = createServerFn({ method: 'GET' })
  .validator(
    (data: {
      eventId: number;
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      search?: string;
      filters?: Record<string, string | null>;
    }) => ({
      eventId: data.eventId,
      page: data.page || 1,
      pageSize: data.pageSize || 25,
      sortBy: data.sortBy || 'created_at',
      sortDirection: data.sortDirection || 'desc',
      search: data.search || '',
      filters: data.filters || {},
    })
  )
  .handler(async (ctx) => {
    const { eventId, page, pageSize, sortBy, sortDirection, search, filters } = ctx.data;
    console.log(`Fetching bookings for event: ${eventId}`, {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
      filters,
    });
    const supabase = createServerClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build the base query
    let query = supabase
      .from('bookings_extended')
      .select(
        `
        *,
        gown(id, ean, rfid)
      `,
        { count: 'exact' }
      )
      .eq('event', eventId);

    // Add search if provided
    if (search) {
      // Use a more comprehensive search across multiple columns
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`
      );
    }

    // Apply filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          // Handle specific filter types
          if (key === 'booking_status') {
            query = query.eq('booking_status', value);
          } else if (key === 'order_type') {
            query = query.eq('order_type', value);
          } else if (key === 'ceremony') {
            query = query.eq('ceremony', value);
          } else {
            // Generic filter
            query = query.eq(key, value);
          }
        }
      });
    }

    // Get the total count
    const { count, error: countError } = await query;
    if (countError) {
      throw new Error(countError.message);
    }

    // Add pagination and sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' }).range(from, to);

    // Execute the query
    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching bookings: ${error.message}`);
      throw new Error(`Error fetching bookings: ${error.message}`);
    }

    return {
      data: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    };
  });

// Query options for event bookings
export const eventBookingsQueryOptions = (
  eventId: number,
  page: number,
  pageSize: number,
  sortBy: string,
  sortDirection: 'asc' | 'desc',
  search: string,
  filters?: Record<string, string | null>
) =>
  queryOptions({
    queryKey: [
      'event',
      eventId,
      'bookings',
      { page, pageSize, sortBy, sortDirection, search, filters },
    ],
    queryFn: () =>
      fetchEventBookings({
        data: { eventId, page, pageSize, sortBy, sortDirection, search, filters },
      }),
    enabled: !!eventId,
  });

// Server function to fetch all bookings for an event (no pagination)
export const fetchAllEventBookings = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number; sortBy?: string; sortDirection?: 'asc' | 'desc' }) => ({
    eventId: data.eventId,
    sortBy: data.sortBy || 'created_at',
    sortDirection: data.sortDirection || 'desc',
  }))
  .handler(async (ctx) => {
    const { eventId, sortBy, sortDirection } = ctx.data;
    console.log(`Fetching all bookings for event: ${eventId}`);
    const supabase = createServerClient();

    // Build the base query
    let query = supabase
      .from('bookings_extended')
      .select(
        `
        *,
        gown(id, ean, rfid)
      `
      )
      .eq('event', eventId);

    // Add sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    // Execute the query
    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching bookings: ${error.message}`);
      throw new Error(`Error fetching bookings: ${error.message}`);
    }

    return data || [];
  });

// Query options for all event bookings (no pagination)
export const allEventBookingsQueryOptions = (
  eventId: number,
  sortBy: string = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc'
) =>
  queryOptions({
    queryKey: ['event', eventId, 'all-bookings', { sortBy, sortDirection }],
    queryFn: () =>
      fetchAllEventBookings({
        data: { eventId, sortBy, sortDirection },
      }),
    enabled: !!eventId,
  });

// Server function to fetch ceremonies for an event
export const fetchEventCeremonies = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching ceremonies for event: ${eventId}`);
    const supabase = createServerClient();

    // Query ceremonies for the event
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

// Query options for event ceremonies
export const eventCeremoniesQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'ceremonies'],
    queryFn: () => fetchEventCeremonies({ data: { eventId } }),
    enabled: !!eventId,
  });
