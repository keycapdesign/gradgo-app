import * as React from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimePickerProps {
    value?: Date;
    onChange: (date: Date) => void;
    label?: string;
    description?: string;
    className?: string;
    disabled?: (date: Date) => boolean;
  }

  export function TimePicker({
    value,
    onChange,
    label,
    description,
    className,
    disabled
  }: TimePickerProps)  {
  const [isOpen, setIsOpen] = React.useState(false);

  // Initialize internal date state from the value prop
  React.useEffect(() => {
    if (value && !isNaN(value.getTime())) {
      // If value is valid, use it
      console.log('Using provided value:', value);
    } else if (!value) {
      // If no value is provided, create a default date
      const defaultDate = new Date();
      defaultDate.setHours(12, 0, 0, 0); // Default to noon
      onChange(defaultDate);
      console.log('Created default date:', defaultDate);
    }
  }, [value, onChange]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    valueStr: string
  ) => {
    if (!value) {
      // If no value exists, create a new date
      const newDate = new Date();
      newDate.setHours(12, 0, 0, 0); // Default to noon
      onChange(newDate);
      return;
    }

    // Create a new date to avoid mutating the original
    const newDate = new Date(value);

    if (type === "hour") {
      const hour = parseInt(valueStr);
      // Determine if we're in AM or PM
      const isPM = newDate.getHours() >= 12;
      // For 12 AM, we need to set to 0, for 12 PM we need to set to 12
      let newHour: number;
      if (hour === 12) {
        newHour = isPM ? 12 : 0;
      } else {
        newHour = isPM ? hour + 12 : hour;
      }
      newDate.setHours(newHour);
    } else if (type === "minute") {
      const minute = parseInt(valueStr);
      newDate.setMinutes(minute);
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      if (valueStr === "AM" && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (valueStr === "PM" && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    // Pass the new date to the parent component
    onChange(newDate);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <div className="text-sm ml-1 font-medium">{label}</div>}
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={typeof disabled === 'function' ? false : disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "hh:mm a")
            ) : (
              <span>Select time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50" sideOffset={4} align="start" forceMount>
          <div className="sm:flex">
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {hours.reverse().map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        value && value.getHours() % 12 === hour % 12
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />    
              </ScrollArea>
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        value && value.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
              <ScrollArea className="">
                <div className="flex sm:flex-col p-2">
                  {["AM", "PM"].map((ampm) => (
                    <Button
                      key={ampm}
                      size="icon"
                      variant={
                        value &&
                        ((ampm === "AM" && value.getHours() < 12) ||
                          (ampm === "PM" && value.getHours() >= 12))
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange("ampm", ampm)}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}