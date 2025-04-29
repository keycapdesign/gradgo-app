import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Error component
export function ProfileError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        We encountered an error while loading your profile.
      </p>
      <p className="text-sm text-destructive mb-4">{error.message}</p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );
}

// Simple ErrorBoundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: (error: Error) => React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}
