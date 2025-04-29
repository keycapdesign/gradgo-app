import { Database } from '@/types/database.types';

// Use the Supabase-generated type for offers
export type Offer = Database['public']['Tables']['offers']['Row'];

// Type for event_offers with the offer relation
export interface EventOffer {
  event_id: number;
  offer_id: string;
  index: number | null;
  offer: Offer | null;
}
