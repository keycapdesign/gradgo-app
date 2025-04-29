import { useMemo, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';

import { ScheduleItemAccordion } from './schedule-item-accordion';
import { ScheduleItem } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { eventScheduleItemsQueryOptions } from '@/utils/student-schedule';
import { studentContactQueryOptions } from '@/utils/student-contact';

export function StudentSchedule() {
  // State for selected day
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Fetch contact data using suspense query
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());

  // Get event ID from contact data
  const eventId = contactData?.event_id;

  // Fetch schedule items for the event
  const { data: eventScheduleItems = [] } = useSuspenseQuery(
    eventScheduleItemsQueryOptions(eventId)
  );

  // Create schedule items array combining event schedule items and booking data
  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const items: ScheduleItem[] = [...eventScheduleItems];

    // Sort items by date
    return items.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [eventScheduleItems]);

  // Extract unique days from schedule items
  const uniqueDays = useMemo(() => {
    const days: Date[] = [];

    scheduleItems.forEach((item) => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        // Check if this day is already in our array
        const exists = days.some((day) => isSameDay(day, date));
        if (!exists) {
          days.push(date);
        }
      }
    });

    // Sort days chronologically
    return days.sort((a, b) => a.getTime() - b.getTime());
  }, [scheduleItems]);

  // Set the first day as selected by default if none is selected
  useMemo(() => {
    if (uniqueDays.length > 0 && !selectedDay) {
      setSelectedDay(uniqueDays[0]);
    }
  }, [uniqueDays, selectedDay]);

  // Filter schedule items by selected day
  const filteredItems = useMemo(() => {
    if (!selectedDay) return scheduleItems;

    return scheduleItems.filter((item) => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp);
      return isSameDay(itemDate, selectedDay);
    });
  }, [scheduleItems, selectedDay]);

  // Generate a unique value for each day to use as tab value
  const getTabValue = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Get the default tab value (first day)
  const defaultTabValue = uniqueDays.length > 0 ? getTabValue(uniqueDays[0]) : '';

  // Handle tab change
  const handleTabChange = (value: string) => {
    const selectedDate = uniqueDays.find((day) => getTabValue(day) === value);
    if (selectedDate) {
      setSelectedDay(selectedDate);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {uniqueDays.length > 0 ? (
        <Tabs defaultValue={defaultTabValue} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full inline-flex h-auto gap-2 bg-transparent">
              {uniqueDays.map((day) => (
                <TabsTrigger
                  key={getTabValue(day)}
                  value={getTabValue(day)}
                  className="px-4 py-4 bg-card border-none dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">{format(day, 'MMM')}</span>
                    <span className="text-4xl font-bold">{format(day, 'd')}</span>
                    <span className="text-xs opacity-80">{format(day, 'EEE')}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {uniqueDays.map((day) => (
            <TabsContent key={getTabValue(day)} value={getTabValue(day)} className="mt-4">
              <div className="space-y-2">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => <ScheduleItemAccordion key={item.id} item={item} />)
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No scheduled events found for this day.</p>
                    <p className="text-sm mt-2">
                      Try selecting a different day or check back later.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p>No scheduled events found.</p>
          <p className="text-sm mt-2">Check back later for updates.</p>
        </div>
      )}
    </div>
  );
}
