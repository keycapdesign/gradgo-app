# PostHog Integration Guide

Follow these steps to integrate PostHog for enhanced analytics:

## 1. Create a PostHog Account
Sign up for a free PostHog account at [posthog.com](https://app.posthog.com/signup).

## 2. Install PostHog
Install the PostHog JavaScript library:

```sh
pnpm add posthog-js
```

## 3. Configure Environment Variables
Add your PostHog API key to your environment variables:

```env
VITE_POSTHOG_API_KEY=your_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

## 4. Initialize PostHog
Add the PostHog provider to your root component:

```tsx
import { PostHogProvider } from '@/components/providers/posthog-provider';

// In your root component
return (
  <PostHogProvider>
    <App />
  </PostHogProvider>
);
```

## 5. Event Tracking
You can track custom events using PostHog:

```tsx
import posthog from 'posthog-js';

posthog.capture('event_name', { property: 'value' });
```

## 6. Benefits
- Heatmaps
- Session recordings
- Detailed user behavior tracking
- Funnels and retention analysis

For more information, visit the [PostHog docs](https://posthog.com/docs).
