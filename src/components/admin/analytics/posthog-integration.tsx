import { BarChart, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PostHogIntegration() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          PostHog Integration Guide
        </CardTitle>
        <CardDescription>
          Follow these steps to integrate PostHog for enhanced analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="setup">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="tracking">Event Tracking</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
          </TabsList>
          <TabsContent value="setup" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">1. Create a PostHog Account</h3>
              <p className="text-sm text-muted-foreground">
                Sign up for a free PostHog account at{' '}
                <a
                  href="https://app.posthog.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  posthog.com
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Install PostHog</h3>
              <p className="text-sm text-muted-foreground">
                Install the PostHog JavaScript library:
              </p>
              <div className="bg-muted p-2 rounded-md mt-2 text-xs font-mono">
                pnpm add posthog-js
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Configure Environment Variables</h3>
              <p className="text-sm text-muted-foreground">
                Add your PostHog API key to your environment variables:
              </p>
              <div className="bg-muted p-2 rounded-md mt-2 text-xs font-mono">
                VITE_POSTHOG_API_KEY=your_api_key_here
                <br />
                VITE_POSTHOG_HOST=https://app.posthog.com
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Initialize PostHog</h3>
              <p className="text-sm text-muted-foreground">
                Add the PostHog provider to your root component:
              </p>
              <div className="bg-muted p-2 rounded-md mt-2 text-xs font-mono">
                {`import { PostHogProvider } from '@/components/providers/posthog-provider';

// In your root component
return (
  <PostHogProvider>
    <App />
  </PostHogProvider>
);`}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="tracking" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Event Tracking</h3>
              <p className="text-sm text-muted-foreground">
                The application is already set up to track events using the utility functions in{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  app/utils/event-tracking.ts
                </code>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                These functions track events both in Supabase and PostHog:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Feature clicks</li>
                <li>Offer clicks</li>
                <li>Gallery views</li>
                <li>Selfie uploads</li>
                <li>User confirmations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Example Usage</h3>
              <div className="bg-muted p-2 rounded-md mt-2 text-xs font-mono">
                {`import { trackFeatureClickEvent } from '@/utils/event-tracking';

// Track a feature click
await trackFeatureClickEvent(
  featureId,
  featureName,
  eventId,
  contactId,
  userId
);`}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="benefits" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Benefits of PostHog</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>
                  <span className="font-medium">Session Recordings</span>: Watch how users interact
                  with your application
                </li>
                <li>
                  <span className="font-medium">Heatmaps</span>: See where users click and interact
                  the most
                </li>
                <li>
                  <span className="font-medium">Funnel Analysis</span>: Track user journeys through
                  your application
                </li>
                <li>
                  <span className="font-medium">Feature Flags</span>: Roll out features gradually to
                  users
                </li>
                <li>
                  <span className="font-medium">A/B Testing</span>: Test different versions of your
                  application
                </li>
                <li>
                  <span className="font-medium">User Cohorts</span>: Group users based on behavior
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <a
            href="https://posthog.com/docs/libraries/react"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            PostHog React Documentation
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
