# Analytics Implementation Guide

This document provides an overview of the analytics implementation in the application.

## Overview

The analytics system tracks user interactions with the application, including:

- Feature clicks
- Offer clicks
- Gallery views
- Selfie uploads
- User confirmations

Data is stored in the `analytics_events` table in the Supabase database and can be viewed in the Analytics dashboard.

## Analytics Dashboard

The Analytics dashboard is available at `/admin/analytics` and provides an overview of key metrics for the selected event:

- Total contacts
- Confirmed users
- Selfies uploaded
- Feature clicks
- Offer clicks
- Gallery views

## Tracking Events

Events are tracked using the utility functions in `app/utils/event-tracking.ts`:

```typescript
// Track a feature click
await trackFeatureClickEvent(featureId, featureName, eventId, contactId, userId);

// Track an offer click
await trackOfferClickEvent(offerId, offerName, eventId, contactId, userId);

// Track a gallery view
await trackGalleryViewEvent(contactId, eventId, userId);

// Track a selfie upload
await trackSelfieUploadEvent(contactId, eventId, userId);

// Track a user confirmation
await trackUserConfirmationEvent(contactId, eventId, userId);
```

## PostHog Integration

The application includes a PostHog integration for enhanced analytics. To enable PostHog:

1. Create a PostHog account at [posthog.com](https://posthog.com)
2. Install the PostHog JavaScript library: `pnpm add posthog-js`
3. Add your PostHog API key to your environment variables:
   ```
   VITE_POSTHOG_API_KEY=your_api_key_here
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```
4. Initialize PostHog in your application by adding the `PostHogProvider` to your root component:

   ```tsx
   import { PostHogProvider } from '@/components/providers/posthog-provider';

   // In your root component
   return (
     <PostHogProvider>
       <App />
     </PostHogProvider>
   );
   ```

## Benefits of PostHog

PostHog provides additional analytics features:

- Session recordings
- Heatmaps
- Funnel analysis
- Feature flags
- A/B testing
- User cohorts

## Database Schema

The `analytics_events` table has the following schema:

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  contact_id INTEGER REFERENCES contacts(id),
  user_id UUID REFERENCES auth.users(id),
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Adding New Event Types

To add a new event type:

1. Add the event type to the `AnalyticsEventType` enum in `app/utils/analytics.ts`
2. Create a tracking function in `app/utils/event-tracking.ts`
3. Add the event to the PostHog tracking in `app/utils/posthog.ts`
4. Add the event to the analytics dashboard in `app/components/admin/analytics/analytics-dashboard.tsx`
