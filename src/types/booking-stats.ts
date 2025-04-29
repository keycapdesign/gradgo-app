export interface BookingStats {
  eventId: number;
  total_count: number;
  collected_count: number;
  returned_count: number;
  late_count: number;
  purchase_count: number;
  _offlineUpdated?: boolean;
  [key: string]: any; // Allow for dynamic properties
}

export interface DetailedGownStats {
  eventId?: number;
  gown_counts?: GownCount[];
  detailed_counts?: DetailedCount[];
  has_mapping?: boolean;
  _offlineUpdated?: boolean;
}

export interface GownCount {
  ean: string;
  count: number;
}

export interface DetailedCount {
  ean: string;
  size: string;
  height: string;
  count: number;
}
