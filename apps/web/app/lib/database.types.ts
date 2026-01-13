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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_type: string
          file_url: string
          id: string
          title: string
          visible_to_public: boolean | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          title: string
          visible_to_public?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          visible_to_public?: boolean | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          allow_early_access: boolean | null
          amount_paid: number
          checked_in: boolean | null
          checked_in_at: string | null
          created_at: string | null
          email: string
          first_name: string
          formula: string
          id: string
          last_name: string
          license_plate: string
          motorcycle_brand: string
          motorcycle_model: string
          password_hash: string | null
          payment_status: string
          phone: string
          qr_code: string
          qr_code_image_url: string | null
          ride_type: string
          stripe_payment_id: string | null
          is_admin: boolean | null
        }
        Insert: {
          allow_early_access?: boolean | null
          amount_paid: number
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email: string
          first_name: string
          formula: string
          id?: string
          last_name: string
          license_plate: string
          motorcycle_brand: string
          motorcycle_model: string
          password_hash?: string | null
          payment_status?: string
          phone: string
          qr_code: string
          qr_code_image_url?: string | null
          ride_type: string
          stripe_payment_id?: string | null
          is_admin?: boolean | null
        }
        Update: {
          allow_early_access?: boolean | null
          amount_paid?: number
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          formula?: string
          id?: string
          last_name?: string
          license_plate?: string
          motorcycle_brand?: string
          motorcycle_model?: string
          password_hash?: string | null
          payment_status?: string
          phone?: string
          qr_code?: string
          qr_code_image_url?: string | null
          ride_type?: string
          stripe_payment_id?: string | null
          is_admin?: boolean | null
        }
        Relationships: []
      }
      rally_submissions: {
        Row: {
          created_at: string | null
          end_km: number | null
          end_km_locked: boolean | null
          final_score: number | null
          id: string
          participant_id: string
          rz1_code: string | null
          rz2_code: string | null
          rz3_code: string | null
          rz4_code: string | null
          rz5_code: string | null
          rz6_code: string | null
          rz7_code: string | null
          rz8_code: string | null
          shadow_total: number | null
          start_km: number | null
          start_km_locked: boolean | null
          submitted_at: string | null
          total_distance: number | null
          total_points: number | null
          used_highways: boolean | null
          weather_bonus: boolean | null
        }
        Insert: {
          created_at?: string | null
          end_km?: number | null
          end_km_locked?: boolean | null
          final_score?: number | null
          id?: string
          participant_id: string
          rz1_code?: string | null
          rz2_code?: string | null
          rz3_code?: string | null
          rz4_code?: string | null
          rz5_code?: string | null
          rz6_code?: string | null
          rz7_code?: string | null
          rz8_code?: string | null
          shadow_total?: number | null
          start_km?: number | null
          start_km_locked?: boolean | null
          submitted_at?: string | null
          total_distance?: number | null
          total_points?: number | null
          used_highways?: boolean | null
          weather_bonus?: boolean | null
        }
        Update: {
          created_at?: string | null
          end_km?: number | null
          end_km_locked?: boolean | null
          final_score?: number | null
          id?: string
          participant_id?: string
          rz1_code?: string | null
          rz2_code?: string | null
          rz3_code?: string | null
          rz4_code?: string | null
          rz5_code?: string | null
          rz6_code?: string | null
          rz7_code?: string | null
          rz8_code?: string | null
          shadow_total?: number | null
          start_km?: number | null
          start_km_locked?: boolean | null
          submitted_at?: string | null
          total_distance?: number | null
          total_points?: number | null
          used_highways?: boolean | null
          weather_bonus?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rally_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      rally_zone_submissions: {
        Row: {
          answer_accuracy: number | null
          answer_latitude: number | null
          answer_longitude: number | null
          answer_timestamp: string | null
          correctness_score: number | null
          created_at: string | null
          entry_accuracy: number | null
          entry_latitude: number | null
          entry_longitude: number | null
          entry_timestamp: string
          id: string
          is_correct: boolean | null
          normalized_answer: string | null
          participant_id: string
          rhythm_score: number | null
          shadow_score: number | null
          submitted_answer: string | null
          updated_at: string | null
          view_score: number | null
          zone_id: string
          zone_time_minutes: number | null
        }
        Insert: {
          answer_accuracy?: number | null
          answer_latitude?: number | null
          answer_longitude?: number | null
          answer_timestamp?: string | null
          correctness_score?: number | null
          created_at?: string | null
          entry_accuracy?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          entry_timestamp: string
          id?: string
          is_correct?: boolean | null
          normalized_answer?: string | null
          participant_id: string
          rhythm_score?: number | null
          shadow_score?: number | null
          submitted_answer?: string | null
          updated_at?: string | null
          view_score?: number | null
          zone_id: string
          zone_time_minutes?: number | null
        }
        Update: {
          answer_accuracy?: number | null
          answer_latitude?: number | null
          answer_longitude?: number | null
          answer_timestamp?: string | null
          correctness_score?: number | null
          created_at?: string | null
          entry_accuracy?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          entry_timestamp?: string
          id?: string
          is_correct?: boolean | null
          normalized_answer?: string | null
          participant_id?: string
          rhythm_score?: number | null
          shadow_score?: number | null
          submitted_answer?: string | null
          updated_at?: string | null
          view_score?: number | null
          zone_id?: string
          zone_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rally_zone_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: never
        Returns: {
          final_score: number
          first_name: string
          last_name: string
          motorcycle_brand: string
          motorcycle_model: string
          rank: number
          shadow_total: number
          total_distance: number
          total_points: number
          zones_completed: number
        }[]
      }
      update_participant_shadow_scores: {
        Args: { p_participant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
