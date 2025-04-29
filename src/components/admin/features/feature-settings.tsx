import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Feature } from '@/components/students/home/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

// Schema for validation
const featureSettingsSchema = z.object({
  is_default: z.boolean(),
  photo_events_only: z.boolean(),
});

type FeatureSettingsFormValues = z.infer<typeof featureSettingsSchema>;

interface FeatureSettingsProps {
  feature: Feature;
  onUpdate: (updatedFeature: Partial<Feature>) => void;
}

export function FeatureSettings({ feature, onUpdate }: FeatureSettingsProps) {
  // Initialize form with feature data
  const form = useForm<FeatureSettingsFormValues>({
    resolver: zodResolver(featureSettingsSchema),
    defaultValues: {
      is_default: Boolean(feature.is_default),
      photo_events_only: Boolean(feature.photo_events_only),
    },
    mode: 'onChange',
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit((values) => {
    onUpdate(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Settings</CardTitle>
            <CardDescription>
              Configure how this feature behaves and when it's displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Show by Default</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Feature will be shown on student home page when no specific features are
                      assigned to an event
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_events_only"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Photo Events Only</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Feature will only be shown for photo events
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
