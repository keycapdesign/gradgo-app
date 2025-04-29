import { useFormContext, Controller } from 'react-hook-form'
import { EventFormValues, EventData } from './types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '@/components/date-time-picker'

// Props interface for the sidebar
interface EventSettingsSidebarProps {
  event: EventData
}

export function EventSettingsSidebar({ event }: EventSettingsSidebarProps) {
  // Get form methods from context
  const { register, control } = useFormContext<EventFormValues>();
  return (
    <div className="lg:w-80 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Settings</CardTitle>
          <CardDescription>
            Additional event settings and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization and External ID */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="organization" className="text-xs text-muted-foreground">Organization</Label>
              <div id="organization" className="font-medium">{event?.organization?.name || 'N/A'}</div>
            </div>
            <div>
              <Label htmlFor="externalId" className="text-xs text-muted-foreground">External ID</Label>
              <div id="externalId" className="font-medium">{event?.external_id || 'N/A'}</div>
            </div>

            {/* Gown Collection Location */}
            <div>
              <Label htmlFor="gownCollectionLocation" className="ml-1">Gown Collection Location</Label>
              <Input
                id="gownCollectionLocation"
                {...register('gownCollectionLocation')}
                className="mt-1"
              />
            </div>

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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
