export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      amenities: {
        Row: {
          created_at: string
          group_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          group_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          group_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      beds: {
        Row: {
          bed_number: number
          bed_type: string | null
          created_at: string
          id: string
          is_disabled: boolean | null
          is_occupied: boolean | null
          library_id: string
          occupant_id: string | null
          price_override: number | null
          room_id: string
        }
        Insert: {
          bed_number: number
          bed_type?: string | null
          created_at?: string
          id?: string
          is_disabled?: boolean | null
          is_occupied?: boolean | null
          library_id: string
          occupant_id?: string | null
          price_override?: number | null
          room_id: string
        }
        Update: {
          bed_number?: number
          bed_type?: string | null
          created_at?: string
          id?: string
          is_disabled?: boolean | null
          is_occupied?: boolean | null
          library_id?: string
          occupant_id?: string | null
          price_override?: number | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_seats: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          seat_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          seat_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_seats_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          created_at: string
          discount_applied: number | null
          end_date: string | null
          final_amount: number
          id: string
          is_monthly: boolean | null
          library_id: string
          notes: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shift_id: string
          start_date: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          discount_applied?: number | null
          end_date?: string | null
          final_amount?: number
          id?: string
          is_monthly?: boolean | null
          library_id: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shift_id: string
          start_date?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          discount_applied?: number | null
          end_date?: string | null
          final_amount?: number
          id?: string
          is_monthly?: boolean | null
          library_id?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shift_id?: string
          start_date?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_customers: {
        Row: {
          address: string | null
          bed_label: string | null
          created_at: string
          customer_type: string
          email: string | null
          id: string
          listing_id: string | null
          meal_preference: string | null
          name: string
          next_renewal: string | null
          notes: string | null
          owner_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          photo_url: string | null
          plan_name: string | null
          room_label: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bed_label?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          listing_id?: string | null
          meal_preference?: string | null
          name: string
          next_renewal?: string | null
          notes?: string | null
          owner_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          photo_url?: string | null
          plan_name?: string | null
          room_label?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bed_label?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          id?: string
          listing_id?: string | null
          meal_preference?: string | null
          name?: string
          next_renewal?: string | null
          notes?: string | null
          owner_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          photo_url?: string | null
          plan_name?: string | null
          room_label?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_customers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          about: string | null
          accepted_refund_policy: boolean
          accepted_terms: boolean
          address: string | null
          avatar_url: string | null
          average_rating: number
          business_name: string | null
          city: string | null
          created_at: string
          display_name: string
          district: string | null
          email: string | null
          id: string
          instagram: string | null
          lat: number | null
          lng: number | null
          locality: string | null
          location_confirmed: boolean
          onboarding_complete: boolean
          onboarding_step: number
          phone: string | null
          pincode: string | null
          primary_category_id: string | null
          slug: string | null
          started_year: number | null
          state: string | null
          title: string | null
          total_reviews: number
          updated_at: string
          user_id: string
          verification: Database["public"]["Enums"]["verification_state"]
          village: string | null
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          about?: string | null
          accepted_refund_policy?: boolean
          accepted_terms?: boolean
          address?: string | null
          avatar_url?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          created_at?: string
          display_name: string
          district?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          locality?: string | null
          location_confirmed?: boolean
          onboarding_complete?: boolean
          onboarding_step?: number
          phone?: string | null
          pincode?: string | null
          primary_category_id?: string | null
          slug?: string | null
          started_year?: number | null
          state?: string | null
          title?: string | null
          total_reviews?: number
          updated_at?: string
          user_id: string
          verification?: Database["public"]["Enums"]["verification_state"]
          village?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          about?: string | null
          accepted_refund_policy?: boolean
          accepted_terms?: boolean
          address?: string | null
          avatar_url?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          district?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lng?: number | null
          locality?: string | null
          location_confirmed?: boolean
          onboarding_complete?: boolean
          onboarding_step?: number
          phone?: string | null
          pincode?: string | null
          primary_category_id?: string | null
          slug?: string | null
          started_year?: number | null
          state?: string | null
          title?: string | null
          total_reviews?: number
          updated_at?: string
          user_id?: string
          verification?: Database["public"]["Enums"]["verification_state"]
          village?: string | null
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          listing_id: string | null
          owner_id: string
          owner_read_at: string | null
          owner_typing_at: string | null
          owner_unread: number
          student_id: string
          student_read_at: string | null
          student_typing_at: string | null
          student_unread: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string | null
          owner_id: string
          owner_read_at?: string | null
          owner_typing_at?: string | null
          owner_unread?: number
          student_id: string
          student_read_at?: string | null
          student_typing_at?: string | null
          student_unread?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string | null
          owner_id?: string
          owner_read_at?: string | null
          owner_typing_at?: string | null
          owner_unread?: number
          student_id?: string
          student_read_at?: string | null
          student_typing_at?: string | null
          student_unread?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_areas: {
        Row: {
          city: string | null
          created_at: string
          fee: number
          id: string
          listing_id: string
          locality: string
          radius_km: number
        }
        Insert: {
          city?: string | null
          created_at?: string
          fee?: number
          id?: string
          listing_id: string
          locality: string
          radius_km?: number
        }
        Update: {
          city?: string | null
          created_at?: string
          fee?: number
          id?: string
          listing_id?: string
          locality?: string
          radius_km?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          message: string | null
          name: string | null
          owner_id: string
          phone: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          name?: string | null
          owner_id: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          name?: string | null
          owner_id?: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          listing_id: string | null
          method: Database["public"]["Enums"]["pay_method"] | null
          owner_id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          listing_id?: string | null
          method?: Database["public"]["Enums"]["pay_method"] | null
          owner_id: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          listing_id?: string | null
          method?: Database["public"]["Enums"]["pay_method"] | null
          owner_id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          booking_id: string | null
          category: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          entry_date: string
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          listing_id: string | null
          method: Database["public"]["Enums"]["pay_method"] | null
          notes: string | null
          owner_id: string
          reference: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          listing_id?: string | null
          method?: Database["public"]["Enums"]["pay_method"] | null
          notes?: string | null
          owner_id: string
          reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          listing_id?: string | null
          method?: Database["public"]["Enums"]["pay_method"] | null
          notes?: string | null
          owner_id?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "listing_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      libraries: {
        Row: {
          address: string
          average_rating: number | null
          banner_url: string | null
          city: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facilities: Json | null
          gender_preference: string | null
          id: string
          is_featured: boolean
          map_lat: number | null
          map_lng: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          pincode: string
          profile_url: string | null
          property_type: string | null
          seats_per_row: number | null
          slug: string | null
          state: string
          status: Database["public"]["Enums"]["library_status"]
          theme_id: string | null
          total_beds: number | null
          total_reviews: number | null
          total_rooms: number | null
          total_rows: number | null
          total_seats: number | null
          updated_at: string
          upi_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address: string
          average_rating?: number | null
          banner_url?: string | null
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facilities?: Json | null
          gender_preference?: string | null
          id?: string
          is_featured?: boolean
          map_lat?: number | null
          map_lng?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          pincode?: string
          profile_url?: string | null
          property_type?: string | null
          seats_per_row?: number | null
          slug?: string | null
          state?: string
          status?: Database["public"]["Enums"]["library_status"]
          theme_id?: string | null
          total_beds?: number | null
          total_reviews?: number | null
          total_rooms?: number | null
          total_rows?: number | null
          total_seats?: number | null
          updated_at?: string
          upi_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string
          average_rating?: number | null
          banner_url?: string | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facilities?: Json | null
          gender_preference?: string | null
          id?: string
          is_featured?: boolean
          map_lat?: number | null
          map_lng?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          pincode?: string
          profile_url?: string | null
          property_type?: string | null
          seats_per_row?: number | null
          slug?: string | null
          state?: string
          status?: Database["public"]["Enums"]["library_status"]
          theme_id?: string | null
          total_beds?: number | null
          total_reviews?: number | null
          total_rooms?: number | null
          total_rows?: number | null
          total_seats?: number | null
          updated_at?: string
          upi_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "libraries_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "seat_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      library_images: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          library_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          library_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          library_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_images_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_amenities: {
        Row: {
          amenity_id: string
          listing_id: string
        }
        Insert: {
          amenity_id: string
          listing_id: string
        }
        Update: {
          amenity_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_amenities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_bookings: {
        Row: {
          amount: number
          booking_type: string
          contact_phone: string | null
          created_at: string
          delivery_address: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          discount: number
          end_date: string | null
          final_amount: number
          id: string
          listing_id: string
          notes: string | null
          owner_id: string
          payment_method: Database["public"]["Enums"]["pay_method"] | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          plan_id: string | null
          quantity: number
          scheduled_at: string | null
          service_id: string | null
          slot: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["order_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          booking_type?: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount?: number
          end_date?: string | null
          final_amount?: number
          id?: string
          listing_id: string
          notes?: string | null
          owner_id: string
          payment_method?: Database["public"]["Enums"]["pay_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          plan_id?: string | null
          quantity?: number
          scheduled_at?: string | null
          service_id?: string | null
          slot?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["order_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_type?: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          discount?: number
          end_date?: string | null
          final_amount?: number
          id?: string
          listing_id?: string
          notes?: string | null
          owner_id?: string
          payment_method?: Database["public"]["Enums"]["pay_method"] | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          plan_id?: string | null
          quantity?: number
          scheduled_at?: string | null
          service_id?: string | null
          slot?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["order_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_bookings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "listing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "listing_services"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          id: string
          is_closed: boolean
          listing_id: string
          open_time: string | null
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          id?: string
          is_closed?: boolean
          listing_id: string
          open_time?: string | null
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_closed?: boolean
          listing_id?: string
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_hours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          media_type: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          media_type?: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          media_type?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_plans: {
        Row: {
          created_at: string
          end_time: string | null
          features: Json
          id: string
          is_active: boolean
          listing_id: string
          name: string
          original_price: number | null
          period: string
          price: number
          shift_name: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          listing_id: string
          name: string
          original_price?: number | null
          period?: string
          price?: number
          shift_name?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          listing_id?: string
          name?: string
          original_price?: number | null
          period?: string
          price?: number
          shift_name?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_plans_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number
          id: string
          is_approved: boolean
          is_verified_customer: boolean
          listing_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_approved?: boolean
          is_verified_customer?: boolean
          listing_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          is_approved?: boolean
          is_verified_customer?: boolean
          listing_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          food_type: string | null
          id: string
          image_url: string | null
          is_available: boolean
          listing_id: string
          meal_type: string | null
          name: string
          price: number
          price_unit: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          food_type?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          listing_id: string
          meal_type?: string | null
          name: string
          price?: number
          price_unit?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          food_type?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          listing_id?: string
          meal_type?: string | null
          name?: string
          price?: number
          price_unit?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_services_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tags: {
        Row: {
          listing_id: string
          tag_id: string
        }
        Insert: {
          listing_id: string
          tag_id: string
        }
        Update: {
          listing_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_tags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_visits: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          mode: string
          name: string | null
          notes: string | null
          owner_id: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
          visit_date: string
          visit_time: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          mode?: string
          name?: string | null
          notes?: string | null
          owner_id: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visit_date: string
          visit_time?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          mode?: string
          name?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visit_date?: string
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_visits_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          about: string | null
          address: string | null
          advance_amount: number
          available_units: number | null
          average_rating: number
          capacity: number | null
          category_id: string
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          electricity_charge: number
          email: string | null
          gender_preference: string
          id: string
          is_featured: boolean
          is_open_now: boolean
          lat: number | null
          lng: number | null
          locality: string | null
          maintenance_charge: number
          other_charges: number
          owner_id: string
          phone: string | null
          pincode: string | null
          price_current: number | null
          price_offer: number | null
          price_original: number | null
          price_unit: string
          published_at: string | null
          room_types: Json
          rules: string[]
          security_deposit: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["listing_state"]
          subcategory_id: string | null
          title: string
          total_reviews: number
          updated_at: string
          verification: Database["public"]["Enums"]["verification_state"]
          view_count: number
          water_charge: number
          whatsapp: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          advance_amount?: number
          available_units?: number | null
          average_rating?: number
          capacity?: number | null
          category_id: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          electricity_charge?: number
          email?: string | null
          gender_preference?: string
          id?: string
          is_featured?: boolean
          is_open_now?: boolean
          lat?: number | null
          lng?: number | null
          locality?: string | null
          maintenance_charge?: number
          other_charges?: number
          owner_id: string
          phone?: string | null
          pincode?: string | null
          price_current?: number | null
          price_offer?: number | null
          price_original?: number | null
          price_unit?: string
          published_at?: string | null
          room_types?: Json
          rules?: string[]
          security_deposit?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["listing_state"]
          subcategory_id?: string | null
          title: string
          total_reviews?: number
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_state"]
          view_count?: number
          water_charge?: number
          whatsapp?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          advance_amount?: number
          available_units?: number | null
          average_rating?: number
          capacity?: number | null
          category_id?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          electricity_charge?: number
          email?: string | null
          gender_preference?: string
          id?: string
          is_featured?: boolean
          is_open_now?: boolean
          lat?: number | null
          lng?: number | null
          locality?: string | null
          maintenance_charge?: number
          other_charges?: number
          owner_id?: string
          phone?: string | null
          pincode?: string | null
          price_current?: number | null
          price_offer?: number | null
          price_original?: number | null
          price_unit?: string
          published_at?: string | null
          room_types?: Json
          rules?: string[]
          security_deposit?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["listing_state"]
          subcategory_id?: string | null
          title?: string
          total_reviews?: number
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_state"]
          view_count?: number
          water_charge?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          max_seats: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_seats?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_seats?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          media_type: string
          media_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string
          media_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string
          media_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          bookings: boolean
          nearby: boolean
          offers: boolean
          payments: boolean
          push_enabled: boolean
          reviews: boolean
          saved_search: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bookings?: boolean
          nearby?: boolean
          offers?: boolean
          payments?: boolean
          push_enabled?: boolean
          reviews?: boolean
          saved_search?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bookings?: boolean
          nearby?: boolean
          offers?: boolean
          payments?: boolean
          push_enabled?: boolean
          reviews?: boolean
          saved_search?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          badge: string | null
          conditions: string | null
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          listing_id: string
          offer_price: number | null
          original_price: number | null
          promo_code: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          badge?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id: string
          offer_price?: number | null
          original_price?: number | null
          promo_code?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          badge?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          listing_id?: string
          offer_price?: number | null
          original_price?: number | null
          promo_code?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_memberships: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          owner_id: string
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          owner_id: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          owner_id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          gender: string | null
          id: string
          lat: number | null
          lng: number | null
          needs_onboarding: boolean
          phone: string | null
          push_opted_in: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string
          gender?: string | null
          id: string
          lat?: number | null
          lng?: number | null
          needs_onboarding?: boolean
          phone?: string | null
          push_opted_in?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          needs_onboarding?: boolean
          phone?: string | null
          push_opted_in?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      push_campaigns: {
        Row: {
          action_url: string | null
          audience: string
          audience_city: string | null
          audience_lat: number | null
          audience_lng: number | null
          banner_url: string | null
          body: string
          created_at: string
          created_by: string | null
          failed_count: number
          icon_url: string | null
          id: string
          radius_km: number
          sent_at: string | null
          sent_count: number
          source: string
          status: string
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          audience?: string
          audience_city?: string | null
          audience_lat?: number | null
          audience_lng?: number | null
          banner_url?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          icon_url?: string | null
          id?: string
          radius_km?: number
          sent_at?: string | null
          sent_count?: number
          source?: string
          status?: string
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          audience?: string
          audience_city?: string | null
          audience_lat?: number | null
          audience_lng?: number | null
          banner_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number
          icon_url?: string | null
          id?: string
          radius_km?: number
          sent_at?: string | null
          sent_count?: number
          source?: string
          status?: string
          tag?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_devices: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          last_seen_at: string
          lat: number | null
          lng: number | null
          platform: string
          token: string
          topics: string[]
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          platform?: string
          token: string
          topics?: string[]
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          platform?: string
          token?: string
          topics?: string[]
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          review_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          review_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          review_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "listing_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "listing_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          review_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          review_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          review_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "listing_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          library_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          library_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          library_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          current_occupancy: number
          extra_requirements: string | null
          floor_number: number | null
          has_ac: boolean | null
          has_attached_bath: boolean | null
          has_balcony: boolean | null
          has_study_table: boolean | null
          has_wardrobe: boolean | null
          has_wifi: boolean | null
          id: string
          images: Json | null
          is_available: boolean | null
          is_disabled: boolean | null
          library_id: string
          max_persons: number
          monthly_price: number
          name: string
          permissions: string | null
          policies: string | null
          price_per_bed: number
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_occupancy?: number
          extra_requirements?: string | null
          floor_number?: number | null
          has_ac?: boolean | null
          has_attached_bath?: boolean | null
          has_balcony?: boolean | null
          has_study_table?: boolean | null
          has_wardrobe?: boolean | null
          has_wifi?: boolean | null
          id?: string
          images?: Json | null
          is_available?: boolean | null
          is_disabled?: boolean | null
          library_id: string
          max_persons?: number
          monthly_price?: number
          name: string
          permissions?: string | null
          policies?: string | null
          price_per_bed?: number
          room_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_occupancy?: number
          extra_requirements?: string | null
          floor_number?: number | null
          has_ac?: boolean | null
          has_attached_bath?: boolean | null
          has_balcony?: boolean | null
          has_study_table?: boolean | null
          has_wardrobe?: boolean | null
          has_wifi?: boolean | null
          id?: string
          images?: Json | null
          is_available?: boolean | null
          is_disabled?: boolean | null
          library_id?: string
          max_persons?: number
          monthly_price?: number
          name?: string
          permissions?: string | null
          policies?: string | null
          price_per_bed?: number
          room_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_search_matches: {
        Row: {
          id: string
          listing_id: string
          notified_at: string
          saved_search_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          notified_at?: string
          saved_search_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          notified_at?: string
          saved_search_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_search_matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_search_matches_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          category_id: string | null
          city: string | null
          created_at: string
          filters: Json
          id: string
          last_notified_at: string | null
          lat: number | null
          lng: number | null
          max_price: number | null
          min_rating: number | null
          name: string
          notify: boolean
          query: string | null
          radius_km: number
          user_id: string
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          lat?: number | null
          lng?: number | null
          max_price?: number | null
          min_rating?: number | null
          name: string
          notify?: boolean
          query?: string | null
          radius_km?: number
          user_id: string
        }
        Update: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          lat?: number | null
          lng?: number | null
          max_price?: number | null
          min_rating?: number | null
          name?: string
          notify?: boolean
          query?: string | null
          radius_km?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seat_themes: {
        Row: {
          available_color: string | null
          booked_color: string | null
          config: Json | null
          created_at: string
          disabled_color: string | null
          id: string
          name: string
          prebooked_color: string | null
          row_spacing: number | null
          seat_shape: string | null
          seat_spacing: number | null
          selected_color: string | null
        }
        Insert: {
          available_color?: string | null
          booked_color?: string | null
          config?: Json | null
          created_at?: string
          disabled_color?: string | null
          id?: string
          name: string
          prebooked_color?: string | null
          row_spacing?: number | null
          seat_shape?: string | null
          seat_spacing?: number | null
          selected_color?: string | null
        }
        Update: {
          available_color?: string | null
          booked_color?: string | null
          config?: Json | null
          created_at?: string
          disabled_color?: string | null
          id?: string
          name?: string
          prebooked_color?: string | null
          row_spacing?: number | null
          seat_shape?: string | null
          seat_spacing?: number | null
          selected_color?: string | null
        }
        Relationships: []
      }
      seats: {
        Row: {
          created_at: string
          id: string
          is_disabled: boolean | null
          library_id: string
          row_label: string
          seat_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_disabled?: boolean | null
          library_id: string
          row_label: string
          seat_number: number
        }
        Update: {
          created_at?: string
          id?: string
          is_disabled?: boolean | null
          library_id?: string
          row_label?: string
          seat_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "seats_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          discount_valid_until: string | null
          end_time: string
          id: string
          is_active: boolean | null
          library_id: string
          monthly_price: number | null
          name: string
          price_per_seat: number
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          discount_valid_until?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          library_id: string
          monthly_price?: number | null
          name: string
          price_per_seat?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          discount_valid_until?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          library_id?: string
          monthly_price?: number | null
          name?: string
          price_per_seat?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          library_id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          library_id: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          library_id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          library_id: string
          monthly_price: number
          notes: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          seat_id: string | null
          shift_id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          library_id: string
          monthly_price?: number
          notes?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seat_id?: string | null
          shift_id: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          library_id?: string
          monthly_price?: number
          notes?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seat_id?: string | null
          shift_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          aadhaar_ref: string | null
          created_at: string
          document_url: string | null
          id: string
          notes: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["verification_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_ref?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_ref?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_views: {
        Row: {
          id: string
          ip_address: string | null
          library_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          library_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          library_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_views_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          library_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          library_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          library_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_listing_owner: { Args: { _listing: string }; Returns: boolean }
      is_listing_public: { Args: { _listing: string }; Returns: boolean }
      nearby_listings: {
        Args: {
          _category?: string
          _lat: number
          _limit?: number
          _lng: number
          _radius_km?: number
        }
        Returns: {
          average_rating: number
          category_id: string
          city: string
          cover_url: string
          distance_km: number
          id: string
          locality: string
          price_current: number
          slug: string
          title: string
          total_reviews: number
        }[]
      }
      nearby_push_devices: {
        Args: { _lat: number; _lng: number; _radius_km?: number }
        Returns: {
          distance_km: number
          token: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user" | "vendor"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      ledger_kind:
        | "income"
        | "expense"
        | "credit"
        | "debit"
        | "advance"
        | "refund"
      library_status: "pending" | "approved" | "suspended" | "rejected"
      listing_state:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "suspended"
        | "archived"
      notification_type:
        | "booking"
        | "payment"
        | "membership_expiry"
        | "approval"
        | "general"
      order_state:
        | "new"
        | "accepted"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "completed"
        | "cancelled"
      pay_method: "cash" | "upi" | "bank_transfer" | "online" | "manual"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      verification_state: "unverified" | "pending" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "user", "vendor"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      ledger_kind: [
        "income",
        "expense",
        "credit",
        "debit",
        "advance",
        "refund",
      ],
      library_status: ["pending", "approved", "suspended", "rejected"],
      listing_state: [
        "draft",
        "pending",
        "published",
        "rejected",
        "suspended",
        "archived",
      ],
      notification_type: [
        "booking",
        "payment",
        "membership_expiry",
        "approval",
        "general",
      ],
      order_state: [
        "new",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      pay_method: ["cash", "upi", "bank_transfer", "online", "manual"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      verification_state: ["unverified", "pending", "verified"],
    },
  },
} as const
