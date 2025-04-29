import { Event } from './event';
import { Gown } from './gown';

export interface Booking {
  id: number;
  event: number | Event;
  event_name?: string;
  contact?: number;
  full_name?: string;
  email?: string;
  student_id?: string;
  booking_status?: 'awaiting_pickup' | 'collected' | 'returned' | 'late' | string;
  order_type?: 'HIRE' | 'EXTENDED_HIRE' | 'PURCHASE' | string;
  gown?: Gown;
  check_out_time?: string | null;
  check_in_time?: string | null;
  created_at?: string;
  ceremony?: number;
  ceremony_name?: string;
  _offlineUpdated?: boolean;
  [key: string]: any; // Allow for dynamic properties
}
