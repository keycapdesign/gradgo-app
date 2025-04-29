import { Controller, useFormContext } from 'react-hook-form';

import { EventData, EventFormValues } from './types';
import { DateTimePicker } from '@/components/date-time-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EventDetailsFormProps {
  event: EventData;
}

export function EventDetailsForm({ event }: EventDetailsFormProps) {
  // Get form methods from context
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EventFormValues>();
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Main Event Details Card */}
      <Card className="flex-auto w-3/4">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Basic information about the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Name */}
          <div>
            <Label htmlFor="name" className="ml-1">
              Event Name
            </Label>
            <Input id="name" {...register('name')} className="mt-1" />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Event Date/Time */}
          <div>
            <Controller
              control={control}
              name="datetime"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Event Date & Time"
                  description="Select the date and time for the event"
                  disabled={(date: Date) => date < new Date()}
                />
              )}
            />
          </div>

          {/* Gown Collection Location */}
          <div>
            <Label htmlFor="gownCollectionLocation" className="ml-1">
              Gown Collection Location
            </Label>
            <Input
              id="gownCollectionLocation"
              {...register('gownCollectionLocation')}
              className="mt-1"
            />
          </div>

          {/* Organization and External ID - Read-only, less prominent */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Organization:</span>{' '}
                <span className="text-muted-foreground">{event?.organization?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">External ID:</span>{' '}
                <span className="text-muted-foreground">{event?.external_id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Settings Card */}
      <Card className="flex-auto w-1/4">
        <CardHeader>
          <CardTitle>Event Settings</CardTitle>
          <CardDescription>Additional settings for this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Printing End Time */}
          <div>
            <Controller
              control={control}
              name="printingEndTime"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  label="Printing End Time"
                  description="Select when printing should end for this event"
                  disabled={(date: Date) => date < new Date()}
                />
              )}
            />
          </div>

          {/* Gowns Only Checkbox */}
          <div className="pt-2">
            <Controller
              control={control}
              name="isGownsOnly"
              render={({ field }) => (
                <Label htmlFor="isGownsOnly" className="flex items-center space-x-2">
                  <Checkbox
                    id="isGownsOnly"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span>Gowns Only Event</span>
                </Label>
              )}
            />
          </div>

          {/* Face ID Enabled Checkbox */}
          <div className="pt-2">
            <Controller
              control={control}
              name="faceIdEnabled"
              render={({ field }) => (
                <Label htmlFor="faceIdEnabled" className="flex items-center space-x-2">
                  <Checkbox
                    id="faceIdEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span>Enable Face ID</span>
                </Label>
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, new users will be prompted to upload a selfie for photo identification
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
