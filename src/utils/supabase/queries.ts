// Primitive query for fetching a booking by gown RFID (no business logic)
import { createClient } from './client'

export async function queryBookingByGownRfid(rfid: string) {
  const supabase = createClient()
  // Join gowns to bookings, filter by gown.rfid
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      gown:gowns(*),
      event:events(*),
      contact:contacts(*)
    `)
    .eq('gown.rfid', rfid)
    .single()

  if (error) throw error
  return data
}

// Query latest_gown_bookings_by_checkout view by RFID (primitive, no business logic)
export async function queryLatestBookingByGownRfid(rfid: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('latest_gown_bookings_by_checkout')
    .select('*')
    .eq('rfid', rfid)
    .single()

  if (error) throw error
  return data
}
