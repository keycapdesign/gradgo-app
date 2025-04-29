import { Database } from '@/types/database.types';

// Use the Supabase-generated type for schedule_items
export type ScheduleItem = Database['public']['Tables']['schedule_items']['Row'];
