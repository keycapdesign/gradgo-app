import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MfaLoadingCard({
  title = 'Checking security requirements',
  description = 'Please wait while we verify your account...',
}) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8 border-none shadow-none">
      <CardContent className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}
