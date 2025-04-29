import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

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
import { useEventStore } from "@/stores/event-store"
import { activeEventsQueryOptions } from "@/utils/all-events"

interface Event {
  id: number
  name: string
}

export function EventSwitcher({ events: propEvents = [], isLoading: propIsLoading = false }: { events?: Array<Event>, isLoading?: boolean }) {
  // Fetch events directly in the component
  const { data: fetchedEvents = [], isLoading: queryIsLoading } = useQuery(activeEventsQueryOptions())

  // Use provided events if available, otherwise use fetched events
  const events = propEvents.length > 0 ? propEvents : fetchedEvents
  const isLoading = propIsLoading || queryIsLoading
  const [open, setOpen] = React.useState(false)
  const { selectedEvent, setSelectedEvent } = useEventStore()

  // Local state to track the selected ID for UI purposes
  const [selectedId, setSelectedId] = React.useState<number | null>(selectedEvent?.id || null)

  // Initialize the selected ID from the store when component mounts
  useEffect(() => {
    if (selectedEvent) {
      setSelectedId(selectedEvent.id)
    }
  }, [selectedEvent])

  // Find the current selected event from the events array
  const currentSelectedEvent = events.find(event => event.id === selectedId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background/80"
        >
          <span className="truncate flex-1 text-left">
            {isLoading ? 'Loading events...' : (currentSelectedEvent?.name || selectedEvent?.name || "Select event...")}
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search events..." />
          <CommandList>
            <CommandEmpty>No event found.</CommandEmpty>
            <CommandGroup>
              {events.map((event) => (
                <CommandItem
                  key={event.id}
                  value={event.name}
                  onSelect={() => {
                    const newSelectedId = event.id === selectedId ? null : event.id
                    setSelectedId(newSelectedId)
                    setSelectedEvent(newSelectedId ? event : null)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === event.id ? "opacity-100" : "opacity-0"
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
  )
}
