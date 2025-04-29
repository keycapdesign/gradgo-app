import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { createAdminClient, createClient as createServerClient } from '@/utils/supabase/server';

// Server function to fetch event by ID
export const fetchEventById = createServerFn({ method: 'GET' })
  .validator((data: { eventId: string }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select('*, organization(*)')
      .eq('id', eventIdNum)
      .single();

    if (error) {
      console.error(`Error fetching event: ${error.message}`, error);
      if (error.code === 'PGRST116') {
        throw notFound();
      }
      throw new Error(`Error fetching event: ${error.message}`);
    }

    if (!event) {
      console.error(`No event found with ID: ${eventId}`);
      throw notFound();
    }

    console.log(`Found event ${eventId}:`, {
      id: event.id,
      name: event.name,
    });

    return event;
  });

// Server function to fetch schedule items for an event
export const fetchEventScheduleItems = createServerFn({ method: 'GET' })
  .validator((data: { eventId: string }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching schedule items for event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Fetch schedule items
    const { data: scheduleItems, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('event_id', eventIdNum)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(`Error fetching schedule items: ${error.message}`);
      throw new Error(`Error fetching schedule items: ${error.message}`);
    }

    console.log(`Found ${scheduleItems?.length || 0} schedule items for event ${eventId}`);

    return scheduleItems || [];
  });

// Server function to fetch offers for an event
export const fetchEventOffers = createServerFn({ method: 'GET' })
  .validator((data: { eventId: string }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching offers for event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Fetch offers
    const { data: offers, error } = await supabase
      .from('event_offers')
      .select('*, offer:offer_id(*)')
      .eq('event_id', eventIdNum)
      .order('index', { ascending: true });

    if (error) {
      console.error(`Error fetching offers: ${error.message}`);
      throw new Error(`Error fetching offers: ${error.message}`);
    }

    console.log(`Found ${offers?.length || 0} offers for event ${eventId}`);

    return offers || [];
  });

// Server function to fetch features for an event
export const fetchEventFeatures = createServerFn({ method: 'GET' })
  .validator((data: { eventId: string }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching features for event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Fetch features
    const { data: features, error } = await supabase
      .from('event_features')
      .select('*, feature:feature_id(*)')
      .eq('event_id', eventIdNum)
      .order('index', { ascending: true });

    if (error) {
      console.error(`Error fetching features: ${error.message}`);
      throw new Error(`Error fetching features: ${error.message}`);
    }

    console.log(`Found ${features?.length || 0} features for event ${eventId}`);

    return features || [];
  });

// Server function to update an event
export const updateEvent = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      eventId: string;
      name: string;
      datetime?: Date | null;
      gownCollectionLocation?: string | null;
      printingEndTime?: Date | null;
      isGownsOnly?: boolean | null;
      faceIdEnabled?: boolean | null;
    }) => ({
      eventId: data.eventId,
      name: data.name,
      datetime: data.datetime,
      gownCollectionLocation: data.gownCollectionLocation,
      printingEndTime: data.printingEndTime,
      isGownsOnly: data.isGownsOnly,
      faceIdEnabled: data.faceIdEnabled,
    })
  )
  .handler(async (ctx) => {
    const {
      eventId,
      name,
      datetime,
      gownCollectionLocation,
      printingEndTime,
      isGownsOnly,
      faceIdEnabled,
    } = ctx.data;
    console.log(`Updating event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Update event
    const { data, error } = await supabase
      .from('events')
      .update({
        name,
        datetime: datetime?.toISOString(),
        gown_collection_location: gownCollectionLocation,
        printing_end_time: printingEndTime?.toISOString(),
        is_gowns_only: isGownsOnly,
        face_id_enabled: faceIdEnabled,
      })
      .eq('id', eventIdNum)
      .select()
      .single();

    if (error) {
      console.error(`Error updating event: ${error.message}`);
      throw new Error(`Error updating event: ${error.message}`);
    }

    console.log(`Updated event ${eventId}`);

    return data;
  });

// Server function to toggle event active status
export const toggleEventActiveStatus = createServerFn({ method: 'POST' })
  .validator((data: { eventId: number; isActive: boolean }) => ({
    eventId: data.eventId,
    isActive: data.isActive,
  }))
  .handler(async (ctx) => {
    const { eventId, isActive } = ctx.data;
    console.log(`Toggling active status for event ${eventId} to ${isActive}`);
    const supabase = createServerClient();

    // Update event active status
    const { data, error } = await supabase
      .from('events')
      .update({
        is_active: isActive,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error(`Error toggling event active status: ${error.message}`);
      throw new Error(`Error toggling event active status: ${error.message}`);
    }

    console.log(`Updated active status for event ${eventId} to ${isActive}`);

    return data;
  });

// Server function to add a schedule item
export const addScheduleItem = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      eventId: string;
      title: string | null;
      description: string | null;
      timestamp: string | null;
    }) => ({
      eventId: data.eventId,
      title: data.title,
      description: data.description,
      timestamp: data.timestamp,
    })
  )
  .handler(async (ctx) => {
    const { eventId, title, description, timestamp } = ctx.data;
    console.log(`Adding schedule item to event ${eventId}`);
    const supabase = createServerClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Add schedule item
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        event_id: eventIdNum,
        title,
        description,
        timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error(`Error adding schedule item: ${error.message}`);
      throw new Error(`Error adding schedule item: ${error.message}`);
    }

    console.log(`Added schedule item to event ${eventId}`);

    return data;
  });

// Server function to update a schedule item
export const updateScheduleItem = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      id: string;
      title?: string | null;
      description?: string | null;
      timestamp?: string | null;
    }) => ({
      id: data.id,
      title: data.title,
      description: data.description,
      timestamp: data.timestamp,
    })
  )
  .handler(async (ctx) => {
    const { id, title, description, timestamp } = ctx.data;
    console.log(`Updating schedule item ${id}`);
    const supabase = createServerClient();

    // Update schedule item
    const { data, error } = await supabase
      .from('schedule_items')
      .update({
        title,
        description,
        timestamp,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating schedule item: ${error.message}`);
      throw new Error(`Error updating schedule item: ${error.message}`);
    }

    console.log(`Updated schedule item ${id}`);

    return data;
  });

// Server function to delete a schedule item
export const deleteScheduleItem = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => ({
    id: data.id,
  }))
  .handler(async (ctx) => {
    const { id } = ctx.data;
    console.log(`Deleting schedule item ${id}`);
    const supabase = createServerClient();

    // Delete schedule item
    const { data, error } = await supabase.from('schedule_items').delete().eq('id', id).select();

    if (error) {
      console.error(`Error deleting schedule item: ${error.message}`);
      throw new Error(`Error deleting schedule item: ${error.message}`);
    }

    console.log(`Deleted schedule item ${id}`);

    return data;
  });

// Server function to update offer order
export const updateOfferOrder = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      offers: Array<{
        offer_id: string;
        event_id: number;
        index: number | null;
      }>;
    }) => ({
      offers: data.offers,
    })
  )
  .handler(async (ctx) => {
    const { offers } = ctx.data;
    console.log(`Updating offer order for ${offers.length} offers`);
    const supabase = createServerClient();

    // Update offer order
    const { data, error } = await supabase
      .from('event_offers')
      .upsert(offers, { onConflict: 'offer_id,event_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Error updating offer order: ${error.message}`);
      throw new Error(`Error updating offer order: ${error.message}`);
    }

    console.log(`Updated offer order for ${offers.length} offers`);

    return data;
  });

// Server function to update feature order
export const updateFeatureOrder = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      features: Array<{
        feature_id: string;
        event_id: number;
        index: number | null;
      }>;
    }) => ({
      features: data.features,
    })
  )
  .handler(async (ctx) => {
    const { features } = ctx.data;
    console.log(`Updating feature order for ${features.length} features`);
    const supabase = createServerClient();

    // Update feature order
    const { data, error } = await supabase
      .from('event_features')
      .upsert(features, { onConflict: 'feature_id,event_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Error updating feature order: ${error.message}`);
      throw new Error(`Error updating feature order: ${error.message}`);
    }

    console.log(`Updated feature order for ${features.length} features`);

    return data;
  });

// Query options for event details
export const eventQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventById({ data: { eventId } }),
  });

// Query options for event schedule items
export const eventScheduleItemsQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['event', eventId, 'scheduleItems'],
    queryFn: () => fetchEventScheduleItems({ data: { eventId } }),
  });

// Query options for event offers
export const eventOffersQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['event', eventId, 'offers'],
    queryFn: () => fetchEventOffers({ data: { eventId } }),
  });

// Query options for event features
export const eventFeaturesQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['event', eventId, 'features'],
    queryFn: () => fetchEventFeatures({ data: { eventId } }),
  });

// Server function to generate invite links for an event
export const generateInviteLinks = createServerFn({ method: 'POST' })
  .validator((data: { eventId: string }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Generating invite links for event ${eventId}`);
    const supabase = createServerClient();
    const supabaseAdmin = createAdminClient();

    // Validate that eventId is a number
    const eventIdNum = parseInt(eventId);
    if (isNaN(eventIdNum)) {
      throw new Error(`Invalid event ID: ${eventId}. Must be a number.`);
    }

    // Fetch contacts and order IDs related to the event
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('contact, order_id')
      .eq('event', eventIdNum);

    if (bookingsError || !bookingsData) {
      console.error(`Error fetching bookings: ${bookingsError?.message}`);
      throw new Error(`Error fetching bookings: ${bookingsError?.message}`);
    }

    const contactIds = bookingsData.map((booking) => booking.contact);
    const contactOrderMap = new Map(
      bookingsData.map((booking) => [booking.contact, booking.order_id])
    );

    // Fetch contacts details, excluding those with email_confirmed set to true
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email, first_name, surname, full_name')
      .in('id', contactIds)
      .eq('email_confirmed', false);

    if (contactsError || !contactsData) {
      console.error(`Error fetching contacts: ${contactsError?.message}`);
      throw new Error(`Error fetching contacts: ${contactsError?.message}`);
    }

    interface InviteLink {
      firstName: string | null;
      surname: string | null;
      fullName: string | null;
      email: string;
      inviteLink: string;
      orderId: string | null;
    }

    const inviteLinks: InviteLink[] = [];

    for (const contact of contactsData) {
      const { id, email, first_name, surname, full_name } = contact;

      if (!email) {
        console.warn(`Contact ${id} has no email address, skipping`);
        continue;
      }

      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: 'https://gradgo.evess.co/complete-signup',
        },
      });

      if (error) {
        console.error(`Error generating invite link for ${email}: ${error.message}`);
        throw new Error(`Error generating invite link for ${email}: ${error.message}`);
      }

      inviteLinks.push({
        firstName: first_name,
        surname,
        fullName: full_name,
        email,
        inviteLink: data.properties.action_link,
        orderId: contactOrderMap.get(id),
      });
    }

    console.log(`Generated ${inviteLinks.length} invite links for event ${eventId}`);
    return { inviteLinks };
  });

// Query options for generating invite links
export const generateInviteLinksQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['event', eventId, 'inviteLinks'],
    queryFn: () => generateInviteLinks({ data: { eventId } }),
  });
