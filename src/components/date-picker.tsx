import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  description,
  className,
  disabled
}: DatePickerProps) {
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
              format(value, "MM/dd/yyyy")
            ) : (
              <span>MM/DD/YYYY</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              className="rounded-md border"
              disabled={disabled}
            />
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}