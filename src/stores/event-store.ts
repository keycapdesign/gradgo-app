import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Event {
  id: number
  name: string
}

interface EventState {
  selectedEvent: Event | null
  setSelectedEvent: (event: Event | null) => void
  clearSelectedEvent: () => void
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      selectedEvent: null,
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      clearSelectedEvent: () => set({ selectedEvent: null }),
    }),
    {
      name: 'event-storage', // unique name for localStorage
    }
  )
)
