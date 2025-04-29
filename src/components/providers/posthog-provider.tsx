import { ReactNode, useEffect } from 'react';
import { initPostHog } from '@/utils/posthog';

interface PostHogProviderProps {
  children: ReactNode;
}

/**
 * PostHog Provider component to initialize PostHog
 * This should be used at the root of your application
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize PostHog when the component mounts
    initPostHog();
    
    // No cleanup needed as PostHog doesn't provide a shutdown method
    // The browser will clean up when the page unloads
  }, []);

  return <>{children}</>;
}
