import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { fetchAllEvents } from '@/utils/all-events';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EventFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function EventFilter({ value, onChange, className }: EventFilterProps) {
  const [open, setOpen] = React.useState(false);

  // Fetch all events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => fetchAllEvents({ data: {} }),
  });

  // Find the current selected event from the events array
  const currentSelectedEvent = events.find(
    (event: { id: number; name: string }) => event.id.toString() === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate flex-1 text-left">
            {isLoading ? 'Loading events...' : currentSelectedEvent?.name || 'All Events'}
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search events..." />
          <CommandList>
            <CommandEmpty>No event found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn('mr-2 h-4 w-4', value === null ? 'opacity-100' : 'opacity-0')}
                />
                All Events
              </CommandItem>
              {events.map((event: { id: number; name: string }) => (
                <CommandItem
                  key={event.id}
                  value={event.name}
                  onSelect={() => {
                    onChange(event.id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === event.id.toString() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {event.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
