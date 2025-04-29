import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface OrderTypeOption {
  value: string
  label: string
}

interface OrderTypeFilterProps {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

const orderTypeOptions: OrderTypeOption[] = [
  { value: 'HIRE', label: 'Hire' },
  { value: 'EXTENDED_HIRE', label: 'Extended Hire' },
  { value: 'PURCHASE', label: 'Purchase' },
]

export function OrderTypeFilter({ value, onChange, className }: OrderTypeFilterProps) {
  const [open, setOpen] = React.useState(false)
  
  // Find the current selected order type
  const currentSelectedOrderType = orderTypeOptions.find(option => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate flex-1 text-left">
            {currentSelectedOrderType?.label || "All Order Types"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search order types..." />
          <CommandList>
            <CommandEmpty>No order type found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                All Order Types
              </CommandItem>
              {orderTypeOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
