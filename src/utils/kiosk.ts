// Fetch booking for kiosk gallery by RFID (read-only, no check-in logic)
import { queryLatestBookingByGownRfid } from '@/utils/supabase/queries'

export async function fetchBookingForKioskByRfid({ rfid }: { rfid: string }) {
  // Use the primitive query for the view, no business logic
  const booking = await queryLatestBookingByGownRfid(rfid)
  if (!booking) return null
  // Optionally, fetch contact if not already joined (but view has contact_id)
  return booking
}
