export type Json<D extends number = 9, DA extends any[] = []> =
	| string
	| number
	| boolean
	| null
	| (D extends DA['length'] ? any : { [key: string]: Json<D, [0, ...DA]> | undefined })
	| (D extends DA['length'] ? any : Json<D, [0, ...DA]>[]);

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          contact_id: number | null
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          contact_id?: number | null
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          contact_id?: number | null
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "analytics_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          name?: string | null
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          body: Json | null
          error_message: string | null
          headers: Json | null
          id: number
          method: string | null
          path: string | null
          response_body: string | null
          response_status: number | null
          timestamp: string | null
        }
        Insert: {
          body?: Json | null
          error_message?: string | null
          headers?: Json | null
          id?: number
          method?: string | null
          path?: string | null
          response_body?: string | null
          response_status?: number | null
          timestamp?: string | null
        }
        Update: {
          body?: Json | null
          error_message?: string | null
          headers?: Json | null
          id?: number
          method?: string | null
          path?: string | null
          response_body?: string | null
          response_status?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          award: string | null
          booking_ean: string | null
          booking_status: string | null
          ceremony: number | null
          check_in_time: string | null
          check_out_time: string | null
          contact: number
          created_at: string
          event: number | null
          gown: number | null
          gown_due_at: string | null
          id: number
          order_id: number | null
          order_number: string | null
          order_type: string | null
          status: Database["public"]["Enums"]["status"]
        }
        Insert: {
          award?: string | null
          booking_ean?: string | null
          booking_status?: string | null
          ceremony?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact: number
          created_at?: string
          event?: number | null
          gown?: number | null
          gown_due_at?: string | null
          id?: number
          order_id?: number | null
          order_number?: string | null
          order_type?: string | null
          status?: Database["public"]["Enums"]["status"]
        }
        Update: {
          award?: string | null
          booking_ean?: string | null
          booking_status?: string | null
          ceremony?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact?: number
          created_at?: string
          event?: number | null
          gown?: number | null
          gown_due_at?: string | null
          id?: number
          order_id?: number | null
          order_number?: string | null
          order_type?: string | null
          status?: Database["public"]["Enums"]["status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ceremonies: {
        Row: {
          datetime: string | null
          event: number | null
          external_id: number | null
          id: number
          name: string | null
        }
        Insert: {
          datetime?: string | null
          event?: number | null
          external_id?: number | null
          id?: number
          name?: string | null
        }
        Update: {
          datetime?: string | null
          event?: number | null
          external_id?: number | null
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ceremonies_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ceremonies_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceremonies_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ceremonies_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ceremonies_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      contact_images: {
        Row: {
          contact_id: number | null
          created_at: string | null
          face_id: string | null
          id: string
          image_id: string | null
          print_credits: number | null
          purchased_download: boolean | null
          purchased_print: boolean | null
          user_id: string | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          face_id?: string | null
          id?: string
          image_id?: string | null
          print_credits?: number | null
          purchased_download?: boolean | null
          purchased_print?: boolean | null
          user_id?: string | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          face_id?: string | null
          id?: string
          image_id?: string | null
          print_credits?: number | null
          purchased_download?: boolean | null
          purchased_print?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contacts: {
        Row: {
          confirmation_email_sent_at: string | null
          created_at: string
          email: string | null
          email_confirmed: boolean | null
          face_id: string | null
          first_name: string | null
          full_name: string | null
          has_paid: boolean | null
          id: number
          phone: string | null
          photo_email_sent: boolean | null
          photo_end_time: string | null
          photo_start_time: string | null
          qr_code_path: string | null
          selfie_path: string | null
          selfie_timestamp: string | null
          surname: string | null
          todo_checklist: Json
          user_id: string | null
        }
        Insert: {
          confirmation_email_sent_at?: string | null
          created_at?: string
          email?: string | null
          email_confirmed?: boolean | null
          face_id?: string | null
          first_name?: string | null
          full_name?: string | null
          has_paid?: boolean | null
          id?: number
          phone?: string | null
          photo_email_sent?: boolean | null
          photo_end_time?: string | null
          photo_start_time?: string | null
          qr_code_path?: string | null
          selfie_path?: string | null
          selfie_timestamp?: string | null
          surname?: string | null
          todo_checklist?: Json
          user_id?: string | null
        }
        Update: {
          confirmation_email_sent_at?: string | null
          created_at?: string
          email?: string | null
          email_confirmed?: boolean | null
          face_id?: string | null
          first_name?: string | null
          full_name?: string | null
          has_paid?: boolean | null
          id?: number
          phone?: string | null
          photo_email_sent?: boolean | null
          photo_end_time?: string | null
          photo_start_time?: string | null
          qr_code_path?: string | null
          selfie_path?: string | null
          selfie_timestamp?: string | null
          surname?: string | null
          todo_checklist?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      devices: {
        Row: {
          code: string | null
          created_at: string
          device_id: string | null
          id: string
          last_connected_to: string | null
          name: string | null
          status: string | null
          status_changed_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          device_id?: string | null
          id: string
          last_connected_to?: string | null
          name?: string | null
          status?: string | null
          status_changed_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          last_connected_to?: string | null
          name?: string | null
          status?: string | null
          status_changed_at?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          contact_id: number | null
          email_type: string
          id: string
          metadata: Json | null
          recipient: string
          sent_at: string | null
          status: string
        }
        Insert: {
          contact_id?: number | null
          email_type: string
          id?: string
          metadata?: Json | null
          recipient: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          contact_id?: number | null
          email_type?: string
          id?: string
          metadata?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_features: {
        Row: {
          event_id: number
          feature_id: string
          index: number | null
        }
        Insert: {
          event_id?: number
          feature_id: string
          index?: number | null
        }
        Update: {
          event_id?: number
          feature_id?: string
          index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_features_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_features_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_features_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_features_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_features_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      event_offers: {
        Row: {
          event_id: number
          index: number | null
          offer_id: string
        }
        Insert: {
          event_id?: number
          index?: number | null
          offer_id: string
        }
        Update: {
          event_id?: number
          index?: number | null
          offer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_event_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "public_event_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_event_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "public_event_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "public_event_offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "public_event_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          event_id: number | null
          user_id: string
        }
        Insert: {
          event_id?: number | null
          user_id: string
        }
        Update: {
          event_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          datetime: string | null
          external_id: string
          gown_collection_location: string | null
          id: number
          is_active: boolean
          is_gowns_only: boolean | null
          name: string | null
          organization: number | null
          printing_end_time: string | null
        }
        Insert: {
          created_at?: string
          datetime?: string | null
          external_id: string
          gown_collection_location?: string | null
          id?: number
          is_active?: boolean
          is_gowns_only?: boolean | null
          name?: string | null
          organization?: number | null
          printing_end_time?: string | null
        }
        Update: {
          created_at?: string
          datetime?: string | null
          external_id?: string
          gown_collection_location?: string | null
          id?: number
          is_active?: boolean
          is_gowns_only?: boolean | null
          name?: string | null
          organization?: number | null
          printing_end_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_fkey"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          background_path: string | null
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          link: string | null
          photo_events_only: boolean
          subtitle: string | null
          title: string | null
        }
        Insert: {
          background_path?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          link?: string | null
          photo_events_only?: boolean
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          background_path?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          link?: string | null
          photo_events_only?: boolean
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      gown_composition_sets: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: number | null
          id: number
          is_active: boolean | null
          metadata: Json | null
          name: string
          schema_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          schema_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          id?: number
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          schema_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gown_composition_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "gown_composition_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gown_composition_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "gown_composition_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "gown_composition_sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      gown_compositions: {
        Row: {
          bonnet: string | null
          cap: string | null
          composition_set_id: number | null
          created_at: string | null
          gown: string | null
          hood: string | null
          id: number
          parent_ean: string
          updated_at: string | null
        }
        Insert: {
          bonnet?: string | null
          cap?: string | null
          composition_set_id?: number | null
          created_at?: string | null
          gown?: string | null
          hood?: string | null
          id?: number
          parent_ean: string
          updated_at?: string | null
        }
        Update: {
          bonnet?: string | null
          cap?: string | null
          composition_set_id?: number | null
          created_at?: string | null
          gown?: string | null
          hood?: string | null
          id?: number
          parent_ean?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gown_compositions_composition_set_id_fkey"
            columns: ["composition_set_id"]
            isOneToOne: false
            referencedRelation: "gown_composition_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      gowns: {
        Row: {
          created_at: string
          ean: string | null
          id: number
          in_stock: boolean | null
          rfid: string | null
        }
        Insert: {
          created_at?: string
          ean?: string | null
          id?: number
          in_stock?: boolean | null
          rfid?: string | null
        }
        Update: {
          created_at?: string
          ean?: string | null
          id?: number
          in_stock?: boolean | null
          rfid?: string | null
        }
        Relationships: []
      }
      images: {
        Row: {
          created_at: string | null
          event_id: number | null
          face_ids: string[] | null
          id: string
          original_image_path: string
          timestamp: string
          watermarked_image_path: string
        }
        Insert: {
          created_at?: string | null
          event_id?: number | null
          face_ids?: string[] | null
          id?: string
          original_image_path: string
          timestamp: string
          watermarked_image_path: string
        }
        Update: {
          created_at?: string | null
          event_id?: number | null
          face_ids?: string[] | null
          id?: string
          original_image_path?: string
          timestamp?: string
          watermarked_image_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      messages: {
        Row: {
          bcc: string | null
          cc: string | null
          created: string | null
          deliveryresult: Json | null
          deliverysignature: Json | null
          html_body: string | null
          id: string
          log: Json | null
          recipient: string | null
          sender: string | null
          status: string | null
          subject: string | null
          text_body: string | null
        }
        Insert: {
          bcc?: string | null
          cc?: string | null
          created?: string | null
          deliveryresult?: Json | null
          deliverysignature?: Json | null
          html_body?: string | null
          id?: string
          log?: Json | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          subject?: string | null
          text_body?: string | null
        }
        Update: {
          bcc?: string | null
          cc?: string | null
          created?: string | null
          deliveryresult?: Json | null
          deliverysignature?: Json | null
          html_body?: string | null
          id?: string
          log?: Json | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          subject?: string | null
          text_body?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          background_path: string | null
          color: string | null
          created_at: string
          discount_value: number | null
          expires_at: string | null
          id: string
          link: string | null
          logo_path: string | null
          offer_type: Database["public"]["Enums"]["offer_type"] | null
          title: string | null
        }
        Insert: {
          background_path?: string | null
          color?: string | null
          created_at?: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          link?: string | null
          logo_path?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"] | null
          title?: string | null
        }
        Update: {
          background_path?: string | null
          color?: string | null
          created_at?: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          link?: string | null
          logo_path?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"] | null
          title?: string | null
        }
        Relationships: []
      }
      order_lines: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          order_id: number
          product_id: string | null
          quantity: number | null
          sku: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          order_id: number
          product_id?: string | null
          quantity?: number | null
          sku: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          order_id?: number
          product_id?: string | null
          quantity?: number | null
          sku?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          ceremony: number | null
          contact: number | null
          created_at: string
          external_id: string | null
          id: number
          order_lines: Json[] | null
          status: Database["public"]["Enums"]["status"] | null
        }
        Insert: {
          ceremony?: number | null
          contact?: number | null
          created_at?: string
          external_id?: string | null
          id?: number
          order_lines?: Json[] | null
          status?: Database["public"]["Enums"]["status"] | null
        }
        Update: {
          ceremony?: number | null
          contact?: number | null
          created_at?: string
          external_id?: string | null
          id?: number
          order_lines?: Json[] | null
          status?: Database["public"]["Enums"]["status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "orders_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "orders_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          external_id: number | null
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          external_id?: number | null
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          external_id?: number | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      print_orders: {
        Row: {
          batch_id: string | null
          contact_id: number
          created_at: string
          id: string
          image_filename: string
          image_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          contact_id: number
          created_at?: string
          id?: string
          image_filename: string
          image_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          contact_id?: number
          created_at?: string
          id?: string
          image_filename?: string
          image_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "print_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_orders_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          mfa_required: boolean | null
          name: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          mfa_required?: boolean | null
          name?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          mfa_required?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount_cents: number
          bundle_image_ids: string[] | null
          contact_id: string | null
          created_at: string | null
          currency: string
          device_id: string | null
          digital_image_ids: string[] | null
          has_digital_products: boolean | null
          has_print_products: boolean | null
          id: string
          image_ids: string[]
          metadata: Json | null
          note: string | null
          print_image_ids: string[] | null
          square_checkout_id: string | null
          square_order_id: string | null
          square_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          terminal_id: string | null
          transaction_source: Database["public"]["Enums"]["transaction_source"]
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          bundle_image_ids?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string
          device_id?: string | null
          digital_image_ids?: string[] | null
          has_digital_products?: boolean | null
          has_print_products?: boolean | null
          id?: string
          image_ids: string[]
          metadata?: Json | null
          note?: string | null
          print_image_ids?: string[] | null
          square_checkout_id?: string | null
          square_order_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          terminal_id?: string | null
          transaction_source: Database["public"]["Enums"]["transaction_source"]
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          bundle_image_ids?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string
          device_id?: string | null
          digital_image_ids?: string[] | null
          has_digital_products?: boolean | null
          has_print_products?: boolean | null
          id?: string
          image_ids?: string[]
          metadata?: Json | null
          note?: string | null
          print_image_ids?: string[] | null
          square_checkout_id?: string | null
          square_order_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          terminal_id?: string | null
          transaction_source?: Database["public"]["Enums"]["transaction_source"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          ceremony_id: number | null
          description: string | null
          event_id: number | null
          id: string
          timestamp: string | null
          title: string | null
        }
        Insert: {
          ceremony_id?: number | null
          description?: string | null
          event_id?: number | null
          id?: string
          timestamp?: string | null
          title?: string | null
        }
        Update: {
          ceremony_id?: number | null
          description?: string | null
          event_id?: number | null
          id?: string
          timestamp?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_ceremony_id_fkey"
            columns: ["ceremony_id"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_ceremony_id_fkey"
            columns: ["ceremony_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "schedule_items_ceremony_id_fkey"
            columns: ["ceremony_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      terminal_transactions: {
        Row: {
          contact_id: number | null
          created_at: string
          device_id: string | null
          id: string
          image_ids: string[] | null
          status: string | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          image_ids?: string[] | null
          status?: string | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          image_ids?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "public_terminal_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role_id: string | null
          surname: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role_id?: string | null
          surname?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role_id?: string | null
          surname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["role_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      analytics_events_with_relations: {
        Row: {
          booking_id: number | null
          contact_id: number | null
          event: number | null
          event_data: Json | null
          event_type: string | null
          id: string | null
          timestamp: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
        ]
      }
      bookings_extended: {
        Row: {
          award: string | null
          booking_ean: string | null
          booking_status: string | null
          ceremony: number | null
          check_in_time: string | null
          check_out_time: string | null
          contact: number | null
          created_at: string | null
          email: string | null
          event: number | null
          full_name: string | null
          gown: number | null
          id: number | null
          in_stock: boolean | null
          order_number: string | null
          order_type: string | null
          phone: string | null
          search_column: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["gown_id"]
          },
        ]
      }
      contact_event_details: {
        Row: {
          contact_id: number | null
          email: string | null
          event_id: number | null
          event_name: string | null
          qr_code_path: string | null
          selfie_path: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      contacts_with_recent_booking: {
        Row: {
          award: string | null
          booking_created_at: string | null
          booking_ean: string | null
          booking_id: number | null
          ceremony: number | null
          check_in_time: string | null
          check_out_time: string | null
          contact_created_at: string | null
          contact_id: number | null
          email: string | null
          email_confirmed: boolean | null
          event_id: number | null
          event_name: string | null
          first_name: string | null
          full_name: string | null
          gown: number | null
          order_number: string | null
          order_type: string | null
          phone: string | null
          photo_email_sent: boolean | null
          qr_code_path: string | null
          search_column: string | null
          selfie_path: string | null
          surname: string | null
          todo_checklist: Json | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      distinct_contact_bookings: {
        Row: {
          award: string | null
          booking_ean: string | null
          booking_status: string | null
          ceremony: number | null
          check_in_time: string | null
          check_out_time: string | null
          contact: number | null
          created_at: string | null
          event: number | null
          gown: number | null
          id: number | null
          order_number: string | null
          order_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "ceremonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_ceremony_fkey"
            columns: ["ceremony"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["ceremony_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "bookings_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["gown_id"]
          },
          {
            foreignKeyName: "bookings_gown_fkey"
            columns: ["gown"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["gown_id"]
          },
        ]
      }
      gowns_with_latest_booking: {
        Row: {
          award: string | null
          booking_id: number | null
          booking_status: string | null
          ceremony_id: number | null
          ceremony_name: string | null
          check_in_time: string | null
          check_out_time: string | null
          contact_id: number | null
          created_at: string | null
          ean: string | null
          email: string | null
          event_id: number | null
          event_name: string | null
          full_name: string | null
          gown_id: number | null
          in_stock: boolean | null
          order_number: string | null
          order_type: string | null
          phone: string | null
          rfid: string | null
          search_column: string | null
        }
        Relationships: []
      }
      latest_gown_bookings_by_checkout: {
        Row: {
          award: string | null
          booking_id: number | null
          booking_status: string | null
          ceremony_id: number | null
          ceremony_name: string | null
          check_in_time: string | null
          check_out_time: string | null
          contact_id: number | null
          created_at: string | null
          ean: string | null
          email: string | null
          event_id: number | null
          event_name: string | null
          full_name: string | null
          gown_id: number | null
          in_stock: boolean | null
          order_number: string | null
          order_type: string | null
          phone: string | null
          rfid: string | null
          search_column: string | null
        }
        Relationships: []
      }
      public_gallery_contacts: {
        Row: {
          event_id: number | null
          event_name: string | null
          full_name: string | null
          id: number | null
          printing_end_time: string | null
        }
        Relationships: []
      }
      public_gallery_images: {
        Row: {
          contact_id: number | null
          id: string | null
          image_id: string | null
          original_image_path: string | null
          timestamp: string | null
          watermarked_image_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "analytics_events_with_relations"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_event_details"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_with_recent_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "gowns_with_latest_booking"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "latest_gown_bookings_by_checkout"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_images_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "public_gallery_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          role_name: string | null
          surname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_roles_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles_view: {
        Row: {
          email: string | null
          role_assigned_at: string | null
          role_description: string | null
          role_id: string | null
          role_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_gown_composition: {
        Args: {
          p_composition_set_id: number
          p_parent_ean: string
          p_gown?: string
          p_hood?: string
          p_cap?: string
          p_bonnet?: string
        }
        Returns: number
      }
      adjust_feature_index: {
        Args: { p_event_id: number; p_feature_id: string; p_direction: string }
        Returns: undefined
      }
      adjust_offer_index: {
        Args: { p_event_id: number; p_offer_id: string; p_direction: string }
        Returns: undefined
      }
      assign_limited_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_admin_update_role: {
        Args: { current_role_id: string; new_role_id: string }
        Returns: boolean
      }
      change_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: boolean
      }
      count_confirmed_users_by_event: {
        Args: { event_id: number }
        Returns: number
      }
      count_selfies_by_event: {
        Args: { event_id: number }
        Returns: number
      }
      degree_matches_list: {
        Args: { p_degree: string; p_degree_list: string }
        Returns: boolean
      }
      delete_event_offer: {
        Args: { p_event_id: number; p_offer_id: string }
        Returns: undefined
      }
      delete_gown_composition_set: {
        Args: { p_composition_set_id: number }
        Returns: boolean
      }
      enter_returns_mode: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      exit_returns_mode: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      extract_values_from_pattern: {
        Args: { p_parent_ean: string; p_parent_pattern: string }
        Returns: Json
      }
      generate_gown_composition_from_pattern: {
        Args: { p_composition_set_id: number; p_parent_ean: string }
        Returns: number
      }
      get_active_contacts_for_event: {
        Args: { event_id: number }
        Returns: {
          id: number
          name: string
          photo_start_time: string
          photo_end_time: string
        }[]
      }
      get_booking_counts: {
        Args: { p_event: number }
        Returns: Json
      }
      get_contact_and_booking_ids: {
        Args: { user_id: string }
        Returns: {
          contact_id: number
          booking_id: number
        }[]
      }
      get_detailed_gown_counts: {
        Args: { p_event: number }
        Returns: Json
      }
      get_image_timestamp: {
        Args: { _image_path: string }
        Returns: string
      }
      get_images_for_ceremony: {
        Args: { ceremony_id: number }
        Returns: {
          owner_id: number
          bucket_object: Json
        }[]
      }
      get_unassociated_images: {
        Args: {
          p_contact_id: number
          p_search?: string
          p_date_range?: string[]
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          watermarked_image_path: string
          original_image_path: string
          image_timestamp: string
        }[]
      }
      get_unlinked_features: {
        Args: { _event_id: number; search_term?: string }
        Returns: {
          background_path: string | null
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          link: string | null
          photo_events_only: boolean
          subtitle: string | null
          title: string | null
        }[]
      }
      get_unlinked_offers: {
        Args: { _event_id: number; search_term?: string }
        Returns: {
          background_path: string | null
          color: string | null
          created_at: string
          discount_value: number | null
          expires_at: string | null
          id: string
          link: string | null
          logo_path: string | null
          offer_type: Database["public"]["Enums"]["offer_type"] | null
          title: string | null
        }[]
      }
      get_user_id_by_email: {
        Args: { search_email: string }
        Returns: string
      }
      has_limited_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      insert_student_images: {
        Args: {
          _face_ids: string[]
          _original_image_path: string
          _watermarked_image_path: string
          _timestamp: string
        }
        Returns: {
          returned_contact_id: number
          returned_user_id: string
          returned_face_id: string
          returned_photo_timestamp: string
        }[]
      }
      insert_student_images_from_timestamp: {
        Args: {
          _timestamp: string
          _original_image_path: string
          _watermarked_image_path: string
        }
        Returns: {
          returned_contact_id: number
          returned_user_id: string
          returned_photo_timestamp: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_ceremony_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_customer_service: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_first_contact_image: {
        Args: { contact_id: number }
        Returns: boolean
      }
      is_in_returns_mode: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      original_images_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      parse_gown_ean: {
        Args: {
          p_parent_ean: string
          p_parent_pattern: string
          p_component_pattern: string
        }
        Returns: string
      }
      process_gown_mapping_csv: {
        Args: {
          p_event_id: number
          p_name: string
          p_description: string
          p_csv_data: string
        }
        Returns: Json
      }
      process_order: {
        Args: { data: Json }
        Returns: Json
      }
      process_order_new: {
        Args: { data: Json }
        Returns: Json
      }
      remove_limited_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      send_email_mailgun: {
        Args: { message: Json }
        Returns: Json
      }
      send_email_message: {
        Args: { message: Json }
        Returns: Json
      }
      set_active_gown_composition_set: {
        Args: { p_composition_set_id: number }
        Returns: boolean
      }
      update_contact_images_periodically: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_event_features_by_default: {
        Args: { feature_id: string; is_default: boolean }
        Returns: undefined
      }
      update_event_features_by_photo_events_only: {
        Args: { feature_id: string; photo_events_only: boolean }
        Returns: undefined
      }
      update_overdue_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_event: {
        Args: {
          _name: string
          _datetime: string
          _organization: number
          _external_id: number
        }
        Returns: {
          created_at: string
          datetime: string | null
          external_id: string
          gown_collection_location: string | null
          id: number
          is_active: boolean
          is_gowns_only: boolean | null
          name: string | null
          organization: number | null
          printing_end_time: string | null
        }
      }
    }
    Enums: {
      offer_type: "percentage_off" | "amount_off"
      payment_status: "pending" | "completed" | "failed" | "cancelled"
      status: "active" | "cancelled"
      transaction_source: "online" | "terminal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      offer_type: ["percentage_off", "amount_off"],
      payment_status: ["pending", "completed", "failed", "cancelled"],
      status: ["active", "cancelled"],
      transaction_source: ["online", "terminal"],
    },
  },
} as const
