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
      achievements: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json | null
          description: string
          icon: string
          id: number
          name: string
          points: number | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria?: Json | null
          description: string
          icon: string
          id?: number
          name: string
          points?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json | null
          description?: string
          icon?: string
          id?: number
          name?: string
          points?: number | null
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          downloaded_at: string | null
          generated_at: string | null
          id: string
          participant_id: string
          pdf_url: string | null
          type: string
        }
        Insert: {
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          participant_id: string
          pdf_url?: string | null
          type: string
        }
        Update: {
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          participant_id?: string
          pdf_url?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
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
      email_logs: {
        Row: {
          email_type: string
          id: string
          participant_id: string | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          email_type: string
          id?: string
          participant_id?: string | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          email_type?: string
          id?: string
          participant_id?: string | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      manual_score_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_points: number
          created_at: string | null
          id: string
          participant_id: string
          reason: string
          zone_id: string | null
        }
        Insert: {
          adjusted_by: string
          adjustment_points: number
          created_at?: string | null
          id?: string
          participant_id: string
          reason: string
          zone_id?: string | null
        }
        Update: {
          adjusted_by?: string
          adjustment_points?: number
          created_at?: string | null
          id?: string
          participant_id?: string
          reason?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_score_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_score_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
          {
            foreignKeyName: "manual_score_adjustments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_score_adjustments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      participant_achievements: {
        Row: {
          achievement_id: number
          id: string
          participant_id: string
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: number
          id?: string
          participant_id: string
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: number
          id?: string
          participant_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_achievements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_achievements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      participant_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          is_approved: boolean | null
          is_featured: boolean | null
          likes_count: number | null
          location: string | null
          participant_id: string
          rally_zone_id: number | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          location?: string | null
          participant_id: string
          rally_zone_id?: number | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          location?: string | null
          participant_id?: string
          rally_zone_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_photos_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_photos_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      participants: {
        Row: {
          allow_early_access: boolean | null
          allow_location_sharing: boolean | null
          amount_paid: number
          bio: string | null
          checked_in: boolean | null
          checked_in_at: string | null
          created_at: string | null
          email: string
          first_name: string
          formula: string
          id: string
          is_admin: boolean | null
          last_name: string
          license_plate: string
          motorcycle_brand: string
          motorcycle_model: string
          password_hash: string | null
          payment_status: string
          phone: string
          profile_photo_url: string | null
          qr_code: string
          qr_code_image_url: string | null
          ride_type: string
          show_on_leaderboard: boolean | null
          status: string | null
          stripe_payment_id: string | null
          total_achievement_points: number | null
        }
        Insert: {
          allow_early_access?: boolean | null
          allow_location_sharing?: boolean | null
          amount_paid: number
          bio?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email: string
          first_name: string
          formula: string
          id?: string
          is_admin?: boolean | null
          last_name: string
          license_plate: string
          motorcycle_brand: string
          motorcycle_model: string
          password_hash?: string | null
          payment_status?: string
          phone: string
          profile_photo_url?: string | null
          qr_code: string
          qr_code_image_url?: string | null
          ride_type: string
          show_on_leaderboard?: boolean | null
          status?: string | null
          stripe_payment_id?: string | null
          total_achievement_points?: number | null
        }
        Update: {
          allow_early_access?: boolean | null
          allow_location_sharing?: boolean | null
          amount_paid?: number
          bio?: string | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          formula?: string
          id?: string
          is_admin?: boolean | null
          last_name?: string
          license_plate?: string
          motorcycle_brand?: string
          motorcycle_model?: string
          password_hash?: string | null
          payment_status?: string
          phone?: string
          profile_photo_url?: string | null
          qr_code?: string
          qr_code_image_url?: string | null
          ride_type?: string
          show_on_leaderboard?: boolean | null
          status?: string | null
          stripe_payment_id?: string | null
          total_achievement_points?: number | null
        }
        Relationships: []
      }
      photo_likes: {
        Row: {
          created_at: string | null
          id: string
          participant_id: string
          photo_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id: string
          photo_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_likes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "participant_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      push_delivery_log: {
        Row: {
          created_at: string | null
          delivery_attempt: number | null
          delivery_status: string | null
          error_message: string | null
          first_attempt_at: string | null
          id: number
          last_attempt_at: string | null
          notification_history_id: number | null
          participant_id: string | null
          status_code: number | null
          subscription_endpoint: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_attempt?: number | null
          delivery_status?: string | null
          error_message?: string | null
          first_attempt_at?: string | null
          id?: number
          last_attempt_at?: string | null
          notification_history_id?: number | null
          participant_id?: string | null
          status_code?: number | null
          subscription_endpoint?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_attempt?: number | null
          delivery_status?: string | null
          error_message?: string | null
          first_attempt_at?: string | null
          id?: number
          last_attempt_at?: string | null
          notification_history_id?: number | null
          participant_id?: string | null
          status_code?: number | null
          subscription_endpoint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_delivery_log_notification_history_id_fkey"
            columns: ["notification_history_id"]
            isOneToOne: false
            referencedRelation: "push_notifications_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_delivery_log_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_delivery_log_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      push_message_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          event_type: string | null
          id: number
          is_active: boolean | null
          name: string
          target_group_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          event_type?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          target_group_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          event_type?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          target_group_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_message_templates_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "push_recipient_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notifications_history: {
        Row: {
          body: string
          completed_at: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          expired_count: number | null
          failed_count: number | null
          id: number
          participant_id: string | null
          recipient_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          success_count: number | null
          target_criteria: Json | null
          target_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          completed_at?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          expired_count?: number | null
          failed_count?: number | null
          id?: number
          participant_id?: string | null
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          success_count?: number | null
          target_criteria?: Json | null
          target_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          completed_at?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          expired_count?: number | null
          failed_count?: number | null
          id?: number
          participant_id?: string | null
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          success_count?: number | null
          target_criteria?: Json | null
          target_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      push_recipient_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          criteria: Json
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          participant_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          criteria: Json
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          participant_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          criteria?: Json
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          participant_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          keys: Json
          participant_id: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          keys: Json
          participant_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          keys?: Json
          participant_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
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
          {
            foreignKeyName: "rally_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      rally_zone_submissions: {
        Row: {
          answer_accuracy: number | null
          answer_latitude: number | null
          answer_longitude: number | null
          answer_timestamp: string | null
          approved_at: string | null
          approved_by: string | null
          correctness_score: number | null
          created_at: string | null
          entry_accuracy: number | null
          entry_latitude: number | null
          entry_longitude: number | null
          entry_timestamp: string
          gps_accuracy_low: boolean | null
          gps_within_geofence: boolean | null
          id: string
          is_correct: boolean | null
          is_manual: boolean | null
          normalized_answer: string | null
          participant_id: string
          proof_photo_url: string | null
          reason_if_invalid: string | null
          rhythm_score: number | null
          scan_type: string | null
          shadow_score: number | null
          submitted_answer: string | null
          submitted_offline: boolean | null
          synced_at: string | null
          updated_at: string | null
          valid: boolean | null
          view_score: number | null
          zone_id: string
          zone_time_minutes: number | null
        }
        Insert: {
          answer_accuracy?: number | null
          answer_latitude?: number | null
          answer_longitude?: number | null
          answer_timestamp?: string | null
          approved_at?: string | null
          approved_by?: string | null
          correctness_score?: number | null
          created_at?: string | null
          entry_accuracy?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          entry_timestamp: string
          gps_accuracy_low?: boolean | null
          gps_within_geofence?: boolean | null
          id?: string
          is_correct?: boolean | null
          is_manual?: boolean | null
          normalized_answer?: string | null
          participant_id: string
          proof_photo_url?: string | null
          reason_if_invalid?: string | null
          rhythm_score?: number | null
          scan_type?: string | null
          shadow_score?: number | null
          submitted_answer?: string | null
          submitted_offline?: boolean | null
          synced_at?: string | null
          updated_at?: string | null
          valid?: boolean | null
          view_score?: number | null
          zone_id: string
          zone_time_minutes?: number | null
        }
        Update: {
          answer_accuracy?: number | null
          answer_latitude?: number | null
          answer_longitude?: number | null
          answer_timestamp?: string | null
          approved_at?: string | null
          approved_by?: string | null
          correctness_score?: number | null
          created_at?: string | null
          entry_accuracy?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          entry_timestamp?: string
          gps_accuracy_low?: boolean | null
          gps_within_geofence?: boolean | null
          id?: string
          is_correct?: boolean | null
          is_manual?: boolean | null
          normalized_answer?: string | null
          participant_id?: string
          proof_photo_url?: string | null
          reason_if_invalid?: string | null
          rhythm_score?: number | null
          scan_type?: string | null
          shadow_score?: number | null
          submitted_answer?: string | null
          submitted_offline?: boolean | null
          synced_at?: string | null
          updated_at?: string | null
          valid?: boolean | null
          view_score?: number | null
          zone_id?: string
          zone_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rally_zone_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rally_zone_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
          {
            foreignKeyName: "rally_zone_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rally_zone_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      zone_closure_log: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          id: string
          reason: string | null
          reopened_at: string | null
          reopened_by: string | null
          zone_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          zone_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reopened_at?: string | null
          reopened_by?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_closure_log_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_closure_log_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
          {
            foreignKeyName: "zone_closure_log_reopened_by_fkey"
            columns: ["reopened_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_closure_log_reopened_by_fkey"
            columns: ["reopened_by"]
            isOneToOne: false
            referencedRelation: "rally_director_dashboard"
            referencedColumns: ["rider_id"]
          },
        ]
      }
    }
    Views: {
      rally_director_dashboard: {
        Row: {
          final_score: number | null
          license_plate: string | null
          low_gps_count: number | null
          manual_entries: number | null
          rider_id: string | null
          rider_name: string | null
          rider_status: string | null
          shadow_total: number | null
          total_points: number | null
          zones_approved: number | null
          zones_completed: number | null
          zones_pending: number | null
          zones_rejected: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_photo_likes: { Args: { photo_id: string }; Returns: undefined }
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
      get_pending_validations: {
        Args: never
        Returns: {
          created_at: string
          gps_accuracy_low: boolean
          gps_within_geofence: boolean
          participant_name: string
          proof_photo_url: string
          submission_id: string
          submitted_answer: string
          zone_id: string
        }[]
      }
      get_riders_with_pending_scans: {
        Args: never
        Returns: {
          pending_count: number
          rider_id: string
          rider_name: string
        }[]
      }
      increment_photo_likes: { Args: { photo_id: string }; Returns: undefined }
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
