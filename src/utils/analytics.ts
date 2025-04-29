import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';

// Event types for analytics tracking
export enum AnalyticsEventType {
  FEATURE_CLICK = 'feature_click',
  OFFER_CLICK = 'offer_click',
  GALLERY_VIEW = 'gallery_view',
  SELFIE_UPLOAD = 'selfie_upload',
  USER_CONFIRMATION = 'user_confirmation',
}

// Interface for analytics event data
export interface AnalyticsEvent {
  id: string;
  event_type: string;
  contact_id?: number | null;
  user_id?: string | null;
  event_data?: any;
  timestamp: string;
}

/**
 * Track an analytics event
 * @param eventType The type of event to track
 * @param contactId Optional contact ID associated with the event
 * @param userId Optional user ID associated with the event
 * @param eventData Optional additional data for the event
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  contactId?: number | null,
  userId?: string | null,
  eventData?: any
) {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('analytics_events').insert({
      id: uuidv4(),
      event_type: eventType,
      contact_id: contactId,
      user_id: userId,
      event_data: eventData,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error(`Error tracking ${eventType} event:`, error);
    }
  } catch (error) {
    console.error(`Error tracking ${eventType} event:`, error);
  }
}

// Server function to fetch analytics data for an event
export const fetchEventAnalytics = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching analytics for event: ${eventId}`);
    const supabase = createClient();

    // Get total contacts for the event
    const { count: totalContacts, error: totalContactsError } = await supabase
      .from('bookings')
      .select('contact', { count: 'exact', head: true })
      .eq('event', eventId);

    if (totalContactsError) {
      console.error(`Error fetching total contacts: ${totalContactsError.message}`);
      throw new Error(`Error fetching total contacts: ${totalContactsError.message}`);
    }

    // Get bookings for the event to get contact IDs
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('contact')
      .eq('event', eventId);

    if (bookingsError) {
      console.error(`Error fetching bookings: ${bookingsError.message}`);
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    // Extract contact IDs from bookings
    const contactIds = bookings?.map((booking) => booking.contact) || [];

    // Get confirmed users (users with email_confirmed = true)
    const { count: confirmedUsers, error: confirmedUsersError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('email_confirmed', true)
      .in('id', contactIds);

    if (confirmedUsersError) {
      console.error(`Error fetching confirmed users: ${confirmedUsersError.message}`);
      throw new Error(`Error fetching confirmed users: ${confirmedUsersError.message}`);
    }

    // Get selfies uploaded count
    const { count: selfiesUploaded, error: selfiesUploadedError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .not('selfie_path', 'is', null)
      .in('id', contactIds);

    if (selfiesUploadedError) {
      console.error(`Error fetching selfies uploaded: ${selfiesUploadedError.message}`);
      throw new Error(`Error fetching selfies uploaded: ${selfiesUploadedError.message}`);
    }

    // Get feature clicks
    const { count: featureClicks, error: featureClicksError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', AnalyticsEventType.FEATURE_CLICK)
      .eq('event_data->>event_id', eventId.toString());

    if (featureClicksError) {
      console.error(`Error fetching feature clicks: ${featureClicksError.message}`);
      throw new Error(`Error fetching feature clicks: ${featureClicksError.message}`);
    }

    // Get offer clicks
    const { count: offerClicks, error: offerClicksError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', AnalyticsEventType.OFFER_CLICK)
      .eq('event_data->>event_id', eventId.toString());

    if (offerClicksError) {
      console.error(`Error fetching offer clicks: ${offerClicksError.message}`);
      throw new Error(`Error fetching offer clicks: ${offerClicksError.message}`);
    }

    // Get gallery views
    const { count: galleryViews, error: galleryViewsError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', AnalyticsEventType.GALLERY_VIEW)
      .eq('event_data->>event_id', eventId.toString());

    if (galleryViewsError) {
      console.error(`Error fetching gallery views: ${galleryViewsError.message}`);
      throw new Error(`Error fetching gallery views: ${galleryViewsError.message}`);
    }

    return {
      totalContacts: totalContacts || 0,
      confirmedUsers: confirmedUsers || 0,
      selfiesUploaded: selfiesUploaded || 0,
      featureClicks: featureClicks || 0,
      offerClicks: offerClicks || 0,
      galleryViews: galleryViews || 0,
    };
  });

// Query options for event analytics
export const eventAnalyticsQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: ['event', eventId, 'analytics'],
    queryFn: () => fetchEventAnalytics({ data: { eventId } }),
    enabled: !!eventId,
  });

// Server function to fetch analytics events by type for an event
export const fetchAnalyticsEventsByType = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number; eventType: string }) => ({
    eventId: data.eventId,
    eventType: data.eventType,
  }))
  .handler(async (ctx) => {
    const { eventId, eventType } = ctx.data;
    console.log(`Fetching ${eventType} events for event: ${eventId}`);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', eventType)
      .eq('event_data->>event_id', eventId.toString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error(`Error fetching ${eventType} events: ${error.message}`);
      throw new Error(`Error fetching ${eventType} events: ${error.message}`);
    }

    return data || [];
  });

// Query options for analytics events by type
export const analyticsEventsByTypeQueryOptions = (eventId: number, eventType: string) =>
  queryOptions({
    queryKey: ['event', eventId, 'analytics', eventType],
    queryFn: () => fetchAnalyticsEventsByType({ data: { eventId, eventType } }),
    enabled: !!eventId && !!eventType,
  });
