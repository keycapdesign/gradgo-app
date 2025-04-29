import { createFileRoute } from '@tanstack/react-router';
import { Bell, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/_protected/_student/settings/index/backup')({
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
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize how the app looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <Label htmlFor="mobile-optimization">Mobile Optimization</Label>
                </div>
                <Switch id="mobile-optimization" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <Label htmlFor="schedule-reminders">Schedule Reminders</Label>
                </div>
                <Switch id="schedule-reminders" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <Label htmlFor="offer-notifications">New Offer Alerts</Label>
                </div>
                <Switch id="offer-notifications" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
