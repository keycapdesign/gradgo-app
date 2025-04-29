import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/_protected/_student/settings/index/disabled')({
  component: StudentSettingsRoute,
  loader: () => {
    return {
      title: 'Settings',
    };
  },
});

function StudentSettingsRoute() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Settings are currently unavailable.</p>
        </CardContent>
      </Card>
    </div>
  );
}
