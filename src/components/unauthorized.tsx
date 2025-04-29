import { Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import { AlertCircle, Home, LogIn, RefreshCw } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UnauthorizedErrorProps {
  returnTo?: string;
}

export function UnauthorizedError({ returnTo }: UnauthorizedErrorProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full space-y-8 p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Unauthorized Access</h1>
          <p className="text-muted-foreground">
            You don't have the required permissions to access this area. Please contact your
            administrator if you believe this is an error.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full">
            {/* Try Again button */}
            <Button
              onClick={() => {
                router.invalidate();
              }}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {/* Return to button - uses the returnTo parameter from the route */}
            {returnTo && (
              <Link to={returnTo} className={cn(buttonVariants({ variant: 'default' }))}>
                <Home className="h-4 w-4 mr-2" />
                {returnTo === '/' ? 'Home' : returnTo === '/admin' ? 'Admin Dashboard' : 'Back'}
              </Link>
            )}

            {/* Login button */}
            <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }))}>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
