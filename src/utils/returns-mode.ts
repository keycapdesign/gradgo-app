import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Function to fetch booking by gown RFID
export const fetchBookingByGownRfid = createServerFn({ method: 'GET' })
  .validator((data: { rfid: string }) => ({
    rfid: data.rfid,
  }))
  .handler(async (ctx) => {
    const { rfid } = ctx.data;
    console.log(`Fetching booking for gown with RFID: ${rfid}`);
    const supabase = createServerClient();

    // Query the latest_gown_bookings_by_checkout view to find the booking associated with this RFID
    const { data: booking, error } = await supabase
      .from('latest_gown_bookings_by_checkout')
      .select('*')
      .eq('rfid', rfid)
      .single();

    if (error) {
      console.error(`Error fetching booking by gown RFID: ${error.message}`);
      throw new Error(`Error fetching booking by gown RFID: ${error.message}`);
    }

    if (!booking) {
      throw new Error(`No booking found for gown with RFID: ${rfid}`);
    }

    // Check if the gown is already checked in
    if (booking.in_stock) {
      throw new Error(`This gown is already checked in.`);
    }

    // Check if the booking is late
    const now = new Date();
    const dueDate = booking.due_date ? new Date(booking.due_date) : null;
    const isLate = dueDate && now > dueDate;

    // Add the late status to the booking
    const bookingWithLateStatus = {
      ...booking,
      is_late: isLate,
      // Ensure we have the event and gown objects in the expected format
      event: {
        id: booking.event_id,
        name: booking.event_name,
        organization: booking.organization_id
          ? {
              id: booking.organization_id,
              name: booking.organization_name || '',
            }
          : undefined,
      },
      gown: {
        id: booking.gown_id,
        rfid: booking.rfid,
        ean: booking.ean || '',
      },
    };

    return bookingWithLateStatus;
  });

// Query options for fetching booking by gown RFID
export const bookingByGownRfidQueryOptions = (rfid: string) =>
  queryOptions({
    queryKey: ['booking', 'rfid', rfid],
    queryFn: () => fetchBookingByGownRfid({ data: { rfid } }),
    enabled: !!rfid,
  });
