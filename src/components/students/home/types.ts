import { Database } from '@/types/database.types';

// Use the Supabase-generated type for features
export type Feature = Database['public']['Tables']['features']['Row'];

// Type for checklist items
export type ChecklistItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  link?: string;
};

// Type for checklist state
export type Checklist = Record<string, boolean>;

// Type for quick access cards
export interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
}
