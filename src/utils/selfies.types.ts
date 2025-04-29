export interface SelfieRecord {
  contact_id: number | null | undefined;
  user_id?: string;
  path: string;
  offset_x: number;
  offset_y: number;
  scale: number;
  // Add any other fields as needed
}
