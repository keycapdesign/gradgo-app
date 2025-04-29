import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Function to fetch a contact by gown RFID
export const fetchContactByGownRfid = createServerFn({ method: 'GET' })
  .validator((data: { rfid: string }) => ({
    rfid: data.rfid,
  }))
  .handler(async (ctx) => {
    const { rfid } = ctx.data;
    console.log(`Fetching contact for gown with RFID: ${rfid}`);
    const supabase = createServerClient();

    // Query the latest_gown_bookings_by_checkout view to find the contact associated with this RFID
    const { data: booking, error } = await supabase
      .from('latest_gown_bookings_by_checkout')
      .select('*')
      .eq('rfid', rfid)
      .single();

    if (error) {
      console.error(`Error fetching contact by gown RFID: ${error.message}`);
      throw new Error(`Error fetching contact by gown RFID: ${error.message}`);
    }

    if (!booking) {
      throw new Error(`No booking found for gown with RFID: ${rfid}`);
    }

    return booking;
  });

// Function to update a contact's photo_start_time
export const updateContactPhotoStartTime = createServerFn({ method: 'POST' })
  .validator((data: { contactId: number }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    console.log(`Updating photo_start_time for contact: ${contactId}`);
    const supabase = createServerClient();

    // Set the photo_start_time to the current time
    const now = new Date().toISOString();

    // Update the contact
    const { data, error } = await supabase
      .from('contacts')
      .update({ photo_start_time: now })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating contact photo_start_time: ${error.message}`);
      throw new Error(`Error updating contact photo_start_time: ${error.message}`);
    }

    return data;
  });

// Function to update a contact's photo_end_time
export const updateContactPhotoEndTime = createServerFn({ method: 'POST' })
  .validator((data: { contactId: number }) => ({
    contactId: data.contactId,
  }))
  .handler(async (ctx) => {
    const { contactId } = ctx.data;
    console.log(`Updating photo_end_time for contact: ${contactId}`);
    const supabase = createServerClient();

    // Set the photo_end_time to the current time
    const now = new Date().toISOString();

    // Update the contact
    const { data, error } = await supabase
      .from('contacts')
      .update({ photo_end_time: now })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating contact photo_end_time: ${error.message}`);
      throw new Error(`Error updating contact photo_end_time: ${error.message}`);
    }

    return data;
  });

// Function to fetch active contacts for an event
export const fetchActiveContacts = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching active contacts for event: ${eventId}`);
    const supabase = createServerClient();

    // Use the RPC function to get active contacts for the event
    const { data, error } = await supabase.rpc('get_active_contacts_for_event', {
      event_id: eventId,
    });

    if (error) {
      console.error(`Error fetching active contacts: ${error.message}`);
      throw new Error(`Error fetching active contacts: ${error.message}`);
    }

    return data || [];
  });
