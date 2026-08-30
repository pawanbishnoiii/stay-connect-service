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
          created_at: string
          email: string
          full_name: string
          id: string
          needs_onboarding: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          needs_onboarding?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          needs_onboarding?: boolean
          phone?: string | null
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
      library_status: "pending" | "approved" | "suspended" | "rejected"
      notification_type:
        | "booking"
        | "payment"
        | "membership_expiry"
        | "approval"
        | "general"
      payment_status: "pending" | "completed" | "failed" | "refunded"
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
      library_status: ["pending", "approved", "suspended", "rejected"],
      notification_type: [
        "booking",
        "payment",
        "membership_expiry",
        "approval",
        "general",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
