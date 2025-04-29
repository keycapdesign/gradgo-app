import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  description,
  className,
  disabled
}: DateTimePickerProps) {
  const handleDateSelect = (date: Date | undefined) => {
    console.log('handleDateSelect called with date:', date);

    if (date) {
      try {
        const newDate = new Date(date);
        console.log('Created new date object:', newDate);

        // Preserve time if there was a previous value
        if (value) {
          console.log('Preserving time from previous value:', value);
          newDate.setHours(value.getHours());
          newDate.setMinutes(value.getMinutes());
        }

        console.log('Final date after preserving time:', newDate);
        onChange(newDate);
      } catch (error) {
        console.error('Error in handleDateSelect:', error);
        // If there's an error, create a fresh date as fallback
        onChange(new Date());
      }
    }
  };

  function handleTimeChange(type: "hour" | "minute" | "ampm", valueStr: string) {
    console.log(`handleTimeChange called with type=${type}, value=${valueStr}`);

    // Make sure we have a valid date to work with
    if (!value) {
      console.log('No current date value, creating new date');
      // If no date is set yet, create a new one and set it
      const newDate = new Date();
      onChange(newDate);
      return;
    }

    console.log('Current date before change:', value);

    const newDate = new Date(value);

    try {
      if (type === "hour") {
        const hour = parseInt(valueStr, 10);
        console.log(`Setting hour to ${hour}, current hours=${newDate.getHours()}`);

        // Determine if we're in AM or PM
        const isPM = newDate.getHours() >= 12;
        // For 12 AM, we need to set to 0, for 12 PM we need to set to 12
        let newHour: number;
        if (hour === 12) {
          newHour = isPM ? 12 : 0;
        } else {
          newHour = isPM ? hour + 12 : hour;
        }
        console.log(`Calculated new hour: ${newHour}`);
        newDate.setHours(newHour);
      } else if (type === "minute") {
        const minute = parseInt(valueStr, 10);
        console.log(`Setting minute to ${minute}, current minutes=${newDate.getMinutes()}`);
        newDate.setMinutes(minute);
      } else if (type === "ampm") {
        const hours = newDate.getHours();
        console.log(`Setting AM/PM to ${valueStr}, current hours=${hours}`);

        if (valueStr === "AM" && hours >= 12) {
          newDate.setHours(hours - 12);
        } else if (valueStr === "PM" && hours < 12) {
          newDate.setHours(hours + 12);
        }
      }

      console.log('New date after change:', newDate);
      onChange(newDate);
    } catch (error) {
      console.error('Error in handleTimeChange:', error);
      // If there's an error, create a fresh date as fallback
      onChange(new Date());
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <Label className="text-sm ml-1 font-medium">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value ? (
              format(value, "MM/dd/yyyy hh:mm aa")
            ) : (
              <span>MM/DD/YYYY hh:mm aa</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              className="rounded-md border"
              disabled={disabled}
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1)
                    .reverse()
                    .map((hour) => (
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
                      onClick={() => handleTimeChange("minute", minute.toString())}
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