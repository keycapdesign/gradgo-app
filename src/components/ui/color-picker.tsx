import { forwardRef, useEffect, useState } from 'react';
import { Colorful } from '@uiw/react-color';

import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForwardedRef } from '@/lib/use-forwarded-ref';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(({ disabled, value, onChange, onBlur, name, className, ...props }, forwardedRef) => {
  const ref = useForwardedRef(forwardedRef);
  const [open, setOpen] = useState(false);
  // Use a temporary state for the color being selected
  const [tempColor, setTempColor] = useState(value || '#FFFFFF');

  // Update tempColor when the value prop changes
  useEffect(() => {
    setTempColor(value || '#FFFFFF');
  }, [value]);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    // Update in real-time for preview purposes
    onChange(newColor);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
        <Button
          {...props}
          className={cn('flex items-center gap-2', className)}
          name={name}
          onClick={() => {
            setOpen(true);
          }}
          size="sm"
          variant="outline"
        >
          <div
            className="h-4 w-4 rounded-sm"
            style={{
              backgroundColor: value || '#FFFFFF',
            }}
          />
          {props.children}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full">
        <div className="flex flex-col gap-2">
          <Colorful color={tempColor} onChange={(color) => handleColorChange(color.hex)} />

          <div className="flex items-center gap-2">
            <Input
              maxLength={7}
              onChange={(e) => {
                handleColorChange(e?.currentTarget?.value);
              }}
              ref={ref}
              value={tempColor}
              className="flex-1"
            />

            {/* Save button removed - color updates in real-time */}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
