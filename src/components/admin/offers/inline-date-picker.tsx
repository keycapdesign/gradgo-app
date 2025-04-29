import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InlineDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: (date: Date) => boolean;
  autoOpen?: boolean;
}

export function InlineDatePicker({
  value,
  onChange,
  onBlur,
  className,
  disabled,
  autoOpen = true,
}: InlineDatePickerProps) {
  // Start with the calendar open if autoOpen is true
  const [open, setOpen] = useState(autoOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // This effect runs once on mount to ensure the calendar opens immediately
  useEffect(() => {
    if (autoOpen) {
      // Force the calendar to open immediately
      setOpen(true);
    }
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      try {
        const newDate = new Date(date);

        // Preserve time if there was a previous value
        if (value) {
          newDate.setHours(value.getHours());
          newDate.setMinutes(value.getMinutes());
        }

        onChange(newDate);

        // Close the popover after selection
        setOpen(false);

        // Call onBlur if provided
        if (onBlur) {
          onBlur();
        }
      } catch (error) {
        console.error('Error in handleDateSelect:', error);
        onChange(new Date());
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          // If closing and onBlur is provided, call it
          if (!isOpen && onBlur) {
            onBlur();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="secondary"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
            onClick={() => setOpen(true)} // Ensure it opens on click
          >
            {value ? format(value, 'MM/dd/yyyy') : <span>MM/DD/YYYY</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" ref={calendarRef}>
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            className="rounded-md border"
            disabled={disabled}
            initialFocus
            showOutsideDays={false}
            fixedWeeks
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
