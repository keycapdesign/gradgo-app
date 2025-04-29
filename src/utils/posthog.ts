import { useEffect } from 'react';
import posthog from 'posthog-js';

// Initialize PostHog with your project API key
// This should be called once at the application root
export function initPostHog() {
  if (typeof window !== 'undefined') {
    // Only initialize in the browser
    posthog.init(import.meta.env.VITE_POSTHOG_API_KEY || 'your-api-key', {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      // Enable debug mode in development
      debug: import.meta.env.DEV,
      // Only capture events in production
      capture_pageview: import.meta.env.PROD,
      // Disable autocapture in development
      autocapture: import.meta.env.PROD,
    });
  }
}

// Hook to identify a user in PostHog
export function usePostHogIdentify(userId?: string, userProperties?: Record<string, any>) {
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      posthog.identify(userId, userProperties);
    }
  }, [userId, userProperties]);
}

// Hook to capture a page view in PostHog
export function usePostHogPageView(pageName: string) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', { page: pageName });
    }
  }, [pageName]);
}

// Function to track an event in PostHog
export function trackPostHogEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties);
  }
}

// Function to track a feature click in PostHog
export function trackFeatureClick(featureId: string, featureName: string, eventId: number) {
  trackPostHogEvent('feature_click', {
    feature_id: featureId,
    feature_name: featureName,
    event_id: eventId,
  });
}

// Function to track an offer click in PostHog
export function trackOfferClick(offerId: string, offerName: string, eventId: number) {
  trackPostHogEvent('offer_click', {
    offer_id: offerId,
    offer_name: offerName,
    event_id: eventId,
  });
}

// Function to track a gallery view in PostHog
export function trackGalleryView(contactId: number, eventId: number) {
  trackPostHogEvent('gallery_view', {
    contact_id: contactId,
    event_id: eventId,
  });
}

// Function to track a selfie upload in PostHog
export function trackSelfieUpload(contactId: number, eventId: number) {
  trackPostHogEvent('selfie_upload', {
    contact_id: contactId,
    event_id: eventId,
  });
}

// Function to track a user confirmation in PostHog
export function trackUserConfirmation(contactId: number, eventId: number) {
  trackPostHogEvent('user_confirmation', {
    contact_id: contactId,
    event_id: eventId,
  });
}
