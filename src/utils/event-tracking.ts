import { AnalyticsEventType, trackEvent } from '@/utils/analytics';
import { trackFeatureClick, trackOfferClick, trackGalleryView, trackSelfieUpload, trackUserConfirmation } from '@/utils/posthog';

/**
 * Track a feature click event
 * @param featureId The ID of the feature that was clicked
 * @param featureName The name of the feature that was clicked
 * @param eventId The ID of the event the feature belongs to
 * @param contactId Optional contact ID of the user who clicked the feature
 * @param userId Optional user ID of the user who clicked the feature
 */
export async function trackFeatureClickEvent(
  featureId: string,
  featureName: string,
  eventId: number,
  contactId?: number,
  userId?: string
) {
  // Track in Supabase
  await trackEvent(
    AnalyticsEventType.FEATURE_CLICK,
    contactId,
    userId,
    {
      feature_id: featureId,
      feature_name: featureName,
      event_id: eventId,
      timestamp: new Date().toISOString(),
    }
  );

  // Track in PostHog if available
  if (typeof window !== 'undefined') {
    trackFeatureClick(featureId, featureName, eventId);
  }
}

/**
 * Track an offer click event
 * @param offerId The ID of the offer that was clicked
 * @param offerName The name of the offer that was clicked
 * @param eventId The ID of the event the offer belongs to
 * @param contactId Optional contact ID of the user who clicked the offer
 * @param userId Optional user ID of the user who clicked the offer
 */
export async function trackOfferClickEvent(
  offerId: string,
  offerName: string,
  eventId: number,
  contactId?: number,
  userId?: string
) {
  // Track in Supabase
  await trackEvent(
    AnalyticsEventType.OFFER_CLICK,
    contactId,
    userId,
    {
      offer_id: offerId,
      offer_name: offerName,
      event_id: eventId,
      timestamp: new Date().toISOString(),
    }
  );

  // Track in PostHog if available
  if (typeof window !== 'undefined') {
    trackOfferClick(offerId, offerName, eventId);
  }
}

/**
 * Track a gallery view event
 * @param contactId The ID of the contact whose gallery was viewed
 * @param eventId The ID of the event the gallery belongs to
 * @param userId Optional user ID of the user who viewed the gallery
 */
export async function trackGalleryViewEvent(
  contactId: number,
  eventId: number,
  userId?: string
) {
  // Track in Supabase
  await trackEvent(
    AnalyticsEventType.GALLERY_VIEW,
    contactId,
    userId,
    {
      event_id: eventId,
      timestamp: new Date().toISOString(),
    }
  );

  // Track in PostHog if available
  if (typeof window !== 'undefined') {
    trackGalleryView(contactId, eventId);
  }
}

/**
 * Track a selfie upload event
 * @param contactId The ID of the contact who uploaded a selfie
 * @param eventId The ID of the event the contact belongs to
 * @param userId Optional user ID of the user who uploaded the selfie
 */
export async function trackSelfieUploadEvent(
  contactId: number,
  eventId: number,
  userId?: string
) {
  // Track in Supabase
  await trackEvent(
    AnalyticsEventType.SELFIE_UPLOAD,
    contactId,
    userId,
    {
      event_id: eventId,
      timestamp: new Date().toISOString(),
    }
  );

  // Track in PostHog if available
  if (typeof window !== 'undefined') {
    trackSelfieUpload(contactId, eventId);
  }
}

/**
 * Track a user confirmation event
 * @param contactId The ID of the contact who confirmed their account
 * @param eventId The ID of the event the contact belongs to
 * @param userId Optional user ID of the user who confirmed their account
 */
export async function trackUserConfirmationEvent(
  contactId: number,
  eventId: number,
  userId?: string
) {
  // Track in Supabase
  await trackEvent(
    AnalyticsEventType.USER_CONFIRMATION,
    contactId,
    userId,
    {
      event_id: eventId,
      timestamp: new Date().toISOString(),
    }
  );

  // Track in PostHog if available
  if (typeof window !== 'undefined') {
    trackUserConfirmation(contactId, eventId);
  }
}
