/**
 * AUTO-GENERATED — do not edit manually.
 *
 * Regenerate with:
 *   npm run gen:types -w @ddb/supabase
 *
 * Generated: 2026-04-23T18:58:32.407Z
 * Project:   tjhmboajhjlcufecyigq
 */

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
      choice_points: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lat: number
          lng: number
          name: string
          rally_id: string
          sidetrack_points: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          rally_id: string
          sidetrack_points?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          rally_id?: string
          sidetrack_points?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "choice_points_rally_id_fkey"
            columns: ["rally_id"]
            isOneToOne: false
            referencedRelation: "rallies"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          id: string
          is_active: boolean
          name: string
          registration_closes_at: string | null
          registration_opens_at: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          is_active?: boolean
          name: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          is_active?: boolean
          name?: string
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      participant_answers: {
        Row: {
          id: string
          participant_id: string
          photo_path: string | null
          points_awarded: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["answer_status"]
          submitted_at: string
          submitted_lat: number | null
          submitted_lng: number | null
          task_id: string
          text_answer: string | null
          updated_at: string
          video_path: string | null
        }
        Insert: {
          id?: string
          participant_id: string
          photo_path?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["answer_status"]
          submitted_at?: string
          submitted_lat?: number | null
          submitted_lng?: number | null
          task_id: string
          text_answer?: string | null
          updated_at?: string
          video_path?: string | null
        }
        Update: {
          id?: string
          participant_id?: string
          photo_path?: string | null
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["answer_status"]
          submitted_at?: string
          submitted_lat?: number | null
          submitted_lng?: number | null
          task_id?: string
          text_answer?: string | null
          updated_at?: string
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_answers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string
          emergency_name: string | null
          emergency_phone: string | null
          event_choice: Database["public"]["Enums"]["event_type"]
          event_id: string | null
          first_name: string
          id: string
          last_name: string
          license_plate: string | null
          motorcycle_brand: string | null
          motorcycle_category: Database["public"]["Enums"]["motorcycle_category"]
          motorcycle_model: string | null
          motorcycle_year: number | null
          payment_reference: string | null
          phone: string | null
          status: Database["public"]["Enums"]["participant_status"]
          team_id: string | null
          team_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          emergency_name?: string | null
          emergency_phone?: string | null
          event_choice: Database["public"]["Enums"]["event_type"]
          event_id?: string | null
          first_name: string
          id?: string
          last_name: string
          license_plate?: string | null
          motorcycle_brand?: string | null
          motorcycle_category?: Database["public"]["Enums"]["motorcycle_category"]
          motorcycle_model?: string | null
          motorcycle_year?: number | null
          payment_reference?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          team_id?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          event_choice?: Database["public"]["Enums"]["event_type"]
          event_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_plate?: string | null
          motorcycle_brand?: string | null
          motorcycle_category?: Database["public"]["Enums"]["motorcycle_category"]
          motorcycle_model?: string | null
          motorcycle_year?: number | null
          payment_reference?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          team_id?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rallies: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          event_id: string
          gpx_url: string | null
          id: string
          is_published: boolean
          name: string
          starts_at: string | null
          total_km: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id: string
          gpx_url?: string | null
          id?: string
          is_published?: boolean
          name: string
          starts_at?: string | null
          total_km?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id?: string
          gpx_url?: string | null
          id?: string
          is_published?: boolean
          name?: string
          starts_at?: string | null
          total_km?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rallies_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rally_zones: {
        Row: {
          area_geojson: Json | null
          choice_point_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          time_limit_min: number | null
          updated_at: string
        }
        Insert: {
          area_geojson?: Json | null
          choice_point_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          time_limit_min?: number | null
          updated_at?: string
        }
        Update: {
          area_geojson?: Json | null
          choice_point_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          time_limit_min?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rally_zones_choice_point_id_fkey"
            columns: ["choice_point_id"]
            isOneToOne: true
            referencedRelation: "choice_points"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          metadata: Json
          points: number
          rally_zone_id: string
          sort_order: number
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          metadata?: Json
          points?: number
          rally_zone_id: string
          sort_order?: number
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          metadata?: Json
          points?: number
          rally_zone_id?: string
          sort_order?: number
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_rally_zone_id_fkey"
            columns: ["rally_zone_id"]
            isOneToOne: false
            referencedRelation: "rally_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      answer_status: "pending" | "approved" | "rejected"
      event_type: "adventurous" | "trailblazer"
      motorcycle_category:
        | "adventure"
        | "naked"
        | "sport"
        | "touring"
        | "enduro"
        | "custom"
        | "other"
      participant_status: "pending" | "confirmed" | "cancelled"
      task_type: "photo" | "video" | "quiz" | "text" | "qr" | "gps_proximity"
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
      answer_status: ["pending", "approved", "rejected"],
      event_type: ["adventurous", "trailblazer"],
      motorcycle_category: [
        "adventure",
        "naked",
        "sport",
        "touring",
        "enduro",
        "custom",
        "other",
      ],
      participant_status: ["pending", "confirmed", "cancelled"],
      task_type: ["photo", "video", "quiz", "text", "qr", "gps_proximity"],
    },
  },
} as const
