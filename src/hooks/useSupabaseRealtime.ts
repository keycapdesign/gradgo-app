import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

/**
 * Hook to subscribe to Supabase realtime changes for a specific event
 *
 * @param eventId The ID of the event to subscribe to
 * @returns void
 */
export function useSupabaseRealtime(eventId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!eventId) return

    // Create a Supabase client
    const supabase = createClient()
    let bookingsChannel: RealtimeChannel | null = null
    let gownsChannel: RealtimeChannel | null = null
    let ceremoniesChannel: RealtimeChannel | null = null
    let contactImagesChannel: RealtimeChannel | null = null

    // Set up realtime subscriptions
    const setupRealtimeSubscriptions = async () => {
      console.log(`Setting up realtime subscriptions for event ${eventId}`)

      // Subscribe to changes in the bookings table for this event
      // Note: We use the actual bookings table, not bookings_extended view, as views don't support realtime
      bookingsChannel = supabase
        .channel('event-manager-bookings')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'bookings',
            filter: `event=eq.${eventId}`
          },
          (payload) => {
            console.log('Bookings realtime update received:', payload)

            // Invalidate relevant queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['event', eventId, 'all-bookings'] })
            queryClient.invalidateQueries({ queryKey: ['event', eventId, 'bookingStats'] })
            queryClient.invalidateQueries({ queryKey: ['event', eventId, 'detailedGownStats'] })
          }
        )
        .subscribe((status) => {
          console.log('Bookings realtime subscription status:', status)
        })

      // Subscribe to changes in the gowns table
      // This is needed because gown changes (like RFID updates) can affect the event dashboard
      gownsChannel = supabase
        .channel('event-manager-gowns')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'gowns'
          },
          (payload) => {
            console.log('Gowns realtime update received:', payload)

            // Invalidate relevant queries to refresh the data
            // We invalidate the detailed gown stats since they include gown information
            queryClient.invalidateQueries({ queryKey: ['event', eventId, 'detailedGownStats'] })
          }
        )
        .subscribe((status) => {
          console.log('Gowns realtime subscription status:', status)
        })

      // Subscribe to changes in the ceremonies table for this event
      ceremoniesChannel = supabase
        .channel('event-manager-ceremonies')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'ceremonies',
            filter: `event=eq.${eventId}`
          },
          (payload) => {
            console.log('Ceremonies realtime update received:', payload)

            // Invalidate ceremonies query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['event', eventId, 'ceremonies'] })
          }
        )
        .subscribe((status) => {
          console.log('Ceremonies realtime subscription status:', status)
        })

      // Subscribe to changes in the contact_images table
      // This is useful for tracking image uploads and associations during the event
      contactImagesChannel = supabase
        .channel('event-manager-contact-images')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'contact_images'
            // Note: We don't filter by event here as contact_images doesn't have a direct event reference
            // The event association happens through contacts -> bookings -> events
          },
          (payload) => {
            console.log('Contact images realtime update received:', payload)

            // We don't invalidate any specific queries here as the event manager doesn't directly
            // display contact images, but this subscription can be useful for debugging or future features
          }
        )
        .subscribe((status) => {
          console.log('Contact images realtime subscription status:', status)
        })
    }

    // Set up the subscriptions
    setupRealtimeSubscriptions()

    // Clean up the subscriptions when the component unmounts
    return () => {
      console.log(`Cleaning up realtime subscriptions for event ${eventId}`)
      if (bookingsChannel) {
        supabase.removeChannel(bookingsChannel)
      }
      if (gownsChannel) {
        supabase.removeChannel(gownsChannel)
      }
      if (ceremoniesChannel) {
        supabase.removeChannel(ceremoniesChannel)
      }
      if (contactImagesChannel) {
        supabase.removeChannel(contactImagesChannel)
      }
    }
  }, [eventId, queryClient])
}
