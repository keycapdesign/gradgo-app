export interface Event {
  id: number;
  name: string;
  datetime?: string;
  organization?: {
    id: number;
    name: string;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  cachedAt?: number; // For offline caching
  [key: string]: any; // Allow for dynamic properties
}
