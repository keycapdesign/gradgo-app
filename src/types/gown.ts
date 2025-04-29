export interface Gown {
  id: number;
  ean?: string;
  rfid?: string;
  in_stock?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for dynamic properties
}
