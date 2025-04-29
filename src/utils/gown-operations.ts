import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Function to fetch booking by ID
export const fetchBookingById = createServerFn({ method: 'GET' })
  .validator((data: { bookingId: number }) => ({
    bookingId: data.bookingId,
  }))
  .handler(async (ctx) => {
    const { bookingId } = ctx.data;
    console.log(`Fetching booking with ID: ${bookingId}`);
    const supabase = createServerClient();

    // Query the bookings_extended view to get detailed booking information
    const { data: booking, error } = await supabase
      .from('bookings_extended')
      .select(
        `
        *,
        event:events(id, name, organization),
        gown(id, ean, rfid)
      `
      )
      .eq('id', bookingId)
      .single();

    // If we have an event ID but no event name, fetch the event details separately
    if (booking && booking.event && !booking.event_name) {
      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('id', booking.event)
        .single();

      if (eventData) {
        booking.event_name = eventData.name;
      }
    }

    console.log('Fetched booking with event details:', booking);

    if (error) {
      console.error(`Error fetching booking: ${error.message}`);
      throw new Error(`Error fetching booking: ${error.message}`);
    }

    if (!booking) {
      throw new Error(`No booking found with ID: ${bookingId}`);
    }

    return booking;
  });

// Query options for fetching booking by ID
export const bookingByIdQueryOptions = (bookingId: number) =>
  queryOptions({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBookingById({ data: { bookingId } }),
    enabled: !!bookingId,
  });

// Function to fetch gown by RFID
export const fetchGownByRfid = createServerFn({ method: 'GET' })
  .validator((data: { rfid: string }) => ({
    rfid: data.rfid,
  }))
  .handler(async (ctx) => {
    const { rfid } = ctx.data;
    console.log(`Fetching gown with RFID: ${rfid}`);
    const supabase = createServerClient();

    // Query the gowns table to find a gown with this RFID
    const { data: gown, error } = await supabase
      .from('gowns')
      .select('*')
      .eq('rfid', rfid)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching gown: ${error.message}`);
      throw new Error(`Error fetching gown: ${error.message}`);
    }

    return gown;
  });

// Function to check out a gown
export const checkOutGown = createServerFn({ method: 'POST' })
  .validator((data: { bookingId: number; rfid: string; ean: string }) => ({
    bookingId: data.bookingId,
    rfid: data.rfid,
    ean: data.ean,
  }))
  .handler(async (ctx) => {
    const { bookingId, rfid, ean } = ctx.data;
    console.log(`Checking out gown for booking ${bookingId} with RFID ${rfid}`);
    const supabase = createServerClient();

    // Validate RFID format
    if (rfid && !/^[A-Z0-9]{8}$/i.test(rfid)) {
      throw new Error('Invalid RFID format. RFID must be 8 alphanumeric characters.');
    }

    // Start a transaction
    const now = new Date().toISOString();

    // 1. Check if the gown with this RFID exists
    const { data: existingGown, error: gownError } = await supabase
      .from('gowns')
      .select('*')
      .eq('rfid', rfid)
      .maybeSingle();

    if (gownError) {
      console.error(`Error checking for existing gown: ${gownError.message}`);
      throw new Error(`Error checking for existing gown: ${gownError.message}`);
    }

    let gownId: number;

    // 2. If the gown doesn't exist, create it
    if (!existingGown) {
      const { data: newGown, error: createError } = await supabase
        .from('gowns')
        .insert({
          rfid,
          ean,
          in_stock: false,
        })
        .select()
        .single();

      if (createError) {
        console.error(`Error creating new gown: ${createError.message}`);
        throw new Error(`Error creating new gown: ${createError.message}`);
      }

      gownId = newGown.id;
    } else {
      // If the gown exists but is not in stock, it's already checked out
      if (existingGown.in_stock === false) {
        throw new Error('This gown is already checked out to another student.');
      }

      gownId = existingGown.id;

      // Update the gown's in_stock status
      const { error: updateGownError } = await supabase
        .from('gowns')
        .update({ in_stock: false })
        .eq('id', gownId);

      if (updateGownError) {
        console.error(`Error updating gown status: ${updateGownError.message}`);
        throw new Error(`Error updating gown status: ${updateGownError.message}`);
      }
    }

    // 3. Update the booking with the gown ID and check_out_time
    const { data: updatedBooking, error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        gown: gownId,
        check_out_time: now,
        booking_status: 'collected',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateBookingError) {
      console.error(`Error updating booking: ${updateBookingError.message}`);
      throw new Error(`Error updating booking: ${updateBookingError.message}`);
    }

    return updatedBooking;
  });

// Function to check in a gown
export const checkInGown = createServerFn({ method: 'POST' })
  .validator((data: { bookingId: number; rfid: string; skipRfidCheck?: boolean }) => ({
    bookingId: data.bookingId,
    rfid: data.rfid,
    skipRfidCheck: data.skipRfidCheck || false,
  }))
  .handler(async (ctx) => {
    const { bookingId, rfid, skipRfidCheck } = ctx.data;
    console.log(
      `Checking in gown for booking ${bookingId} with RFID ${rfid} (skipRfidCheck: ${skipRfidCheck})`
    );
    const supabase = createServerClient();

    // Validate RFID format if not skipping check
    if (!skipRfidCheck && rfid && !/^[A-Z0-9]{8}$/i.test(rfid)) {
      throw new Error('Invalid RFID format. RFID must be 8 alphanumeric characters.');
    }

    // Start a transaction
    const now = new Date().toISOString();

    // 1. Get the booking to verify the gown
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('gown')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error(`Error fetching booking: ${bookingError.message}`);
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }

    if (!booking.gown) {
      throw new Error('This booking does not have a gown assigned to it.');
    }

    // 2. Get the gown to verify the RFID if not skipping check
    if (!skipRfidCheck) {
      const { data: gown, error: gownError } = await supabase
        .from('gowns')
        .select('*')
        .eq('id', booking.gown)
        .single();

      if (gownError) {
        console.error(`Error fetching gown: ${gownError.message}`);
        throw new Error(`Error fetching gown: ${gownError.message}`);
      }

      // 3. Verify that the RFID matches
      if (gown.rfid !== rfid) {
        throw new Error(
          `The RFID ${rfid} does not match the gown assigned to this booking (${gown.rfid}).`
        );
      }
    }

    // 4. Update the gown's in_stock status
    const { error: updateGownError } = await supabase
      .from('gowns')
      .update({ in_stock: true })
      .eq('id', booking.gown);

    if (updateGownError) {
      console.error(`Error updating gown status: ${updateGownError.message}`);
      throw new Error(`Error updating gown status: ${updateGownError.message}`);
    }

    // 5. Update the booking with the check_in_time
    const { data: updatedBooking, error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        check_in_time: now,
        booking_status: 'returned',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateBookingError) {
      console.error(`Error updating booking: ${updateBookingError.message}`);
      throw new Error(`Error updating booking: ${updateBookingError.message}`);
    }

    return updatedBooking;
  });

// Function to undo a check-out operation
export const undoCheckout = createServerFn({ method: 'POST' })
  .validator((data: { bookingId: number }) => ({
    bookingId: data.bookingId,
  }))
  .handler(async (ctx) => {
    const { bookingId } = ctx.data;
    console.log(`Undoing check-out for booking ${bookingId}`);
    const supabase = createServerClient();

    // 1. Get the booking to verify it has a gown assigned
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('gown, booking_status')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error(`Error fetching booking: ${bookingError.message}`);
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }

    // Verify the booking has a gown assigned
    if (!booking.gown) {
      throw new Error('This booking does not have a gown assigned to it.');
    }

    // Verify the booking status is 'collected' or 'late'
    if (booking.booking_status !== 'collected' && booking.booking_status !== 'late') {
      throw new Error(
        `Cannot undo check-out for a booking with status '${booking.booking_status}'. Expected 'collected' or 'late'.`
      );
    }

    // 2. Update the gown's in_stock status to true (available)
    const { error: updateGownError } = await supabase
      .from('gowns')
      .update({ in_stock: true })
      .eq('id', booking.gown);

    if (updateGownError) {
      console.error(`Error updating gown status: ${updateGownError.message}`);
      throw new Error(`Error updating gown status: ${updateGownError.message}`);
    }

    // 3. Update the booking to reset check_out_time and status
    const { data: updatedBooking, error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        check_out_time: null,
        booking_status: 'awaiting_pickup',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateBookingError) {
      console.error(`Error updating booking: ${updateBookingError.message}`);
      throw new Error(`Error updating booking: ${updateBookingError.message}`);
    }

    return updatedBooking;
  });

// Function to undo a check-in operation
export const undoCheckin = createServerFn({ method: 'POST' })
  .validator((data: { bookingId: number }) => ({
    bookingId: data.bookingId,
  }))
  .handler(async (ctx) => {
    const { bookingId } = ctx.data;
    console.log(`Undoing check-in for booking ${bookingId}`);
    const supabase = createServerClient();

    // 1. Get the booking to verify it has a gown assigned and is in 'returned' status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('gown, booking_status')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error(`Error fetching booking: ${bookingError.message}`);
      throw new Error(`Error fetching booking: ${bookingError.message}`);
    }

    // Verify the booking has a gown assigned
    if (!booking.gown) {
      throw new Error('This booking does not have a gown assigned to it.');
    }

    // Verify the booking status is 'returned'
    if (booking.booking_status !== 'returned') {
      throw new Error(
        `Cannot undo check-in for a booking with status '${booking.booking_status}'. Expected 'returned'.`
      );
    }

    // 2. Update the gown's in_stock status to false (checked out)
    const { error: updateGownError } = await supabase
      .from('gowns')
      .update({ in_stock: false })
      .eq('id', booking.gown);

    if (updateGownError) {
      console.error(`Error updating gown status: ${updateGownError.message}`);
      throw new Error(`Error updating gown status: ${updateGownError.message}`);
    }

    // 3. Update the booking to reset check_in_time and status
    const { data: updatedBooking, error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        check_in_time: null,
        booking_status: 'collected',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateBookingError) {
      console.error(`Error updating booking: ${updateBookingError.message}`);
      throw new Error(`Error updating booking: ${updateBookingError.message}`);
    }

    return updatedBooking;
  });
