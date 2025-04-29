import { AlertCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function MfaErrorCard({ error, onRetry }) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>There was an issue checking your MFA status</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      </CardContent>
      {onRetry && (
        <CardFooter className="flex justify-center">
          <Button onClick={onRetry} className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retry
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
