// Define the form values type
export interface EventFormValues {
  name: string;
  datetime?: Date;
  gownCollectionLocation: string;
  printingEndTime?: Date;
  isGownsOnly: boolean;
  faceIdEnabled: boolean;
}

// Type for the event data returned from the server
export interface EventData {
  id: number;
  name: string;
  datetime: string | null;
  external_id: string;
  gown_collection_location: string | null;
  is_active: boolean;
  is_gowns_only: boolean | null;
  face_id_enabled: boolean | null;
  printing_end_time: string | null;
  organization: {
    id: number;
    name: string;
  } | null;
}
