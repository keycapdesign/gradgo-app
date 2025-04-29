import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  scrollbarSize?: number | string;
}

function ScrollArea({
  className,
  children,
  scrollbarSize,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar scrollbarSize={scrollbarSize} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

interface ScrollBarProps extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  scrollbarSize?: number | string;
}

function ScrollBar({
  className,
  orientation = "vertical",
  scrollbarSize,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-primary/40 relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
