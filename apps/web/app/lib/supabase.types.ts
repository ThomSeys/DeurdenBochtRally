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
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          participant_id: string
          phone: string
          relationship: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          participant_id: string
          phone: string
          relationship?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          participant_id?: string
          phone?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_sos: {
        Row: {
          created_at: string | null
          id: string
          location_lat: number
          location_lng: number
          message: string | null
          participant_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_lat: number
          location_lng: number
          message?: string | null
          participant_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          message?: string | null
          participant_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_sos_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_sos_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_sos_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          id: number
          latitude: number
          longitude: number
          participant_id: string
          participant_name: string
          participant_phone: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: number
          latitude: number
          longitude: number
          participant_id: string
          participant_name: string
          participant_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          id?: number
          latitude?: number
          longitude?: number
          participant_id?: string
          participant_name?: string
          participant_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        ]
      }
      participant_photos: {
        Row: {
          caption: string | null
          id: string
          image_url: string
          is_approved: boolean | null
          is_featured: boolean | null
          like_count: number | null
          location_lat: number | null
          location_lng: number | null
          participant_id: string
          thumbnail_url: string | null
          uploaded_at: string | null
          zone_id: string | null
        }
        Insert: {
          caption?: string | null
          id?: string
          image_url: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          participant_id: string
          thumbnail_url?: string | null
          uploaded_at?: string | null
          zone_id?: string | null
        }
        Update: {
          caption?: string | null
          id?: string
          image_url?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          location_lat?: number | null
          location_lng?: number | null
          participant_id?: string
          thumbnail_url?: string | null
          uploaded_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_photos_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
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
          paper_roadbook: boolean | null
          password_hash: string | null
          payment_status: string
          phone: string
          profile_photo_url: string | null
          qr_code: string
          qr_code_image_url: string | null
          ride_type: string
          route_preference: string | null
          show_on_leaderboard: boolean | null
          start_location: Json | null
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
          paper_roadbook?: boolean | null
          password_hash?: string | null
          payment_status?: string
          phone: string
          profile_photo_url?: string | null
          qr_code: string
          qr_code_image_url?: string | null
          ride_type: string
          route_preference?: string | null
          show_on_leaderboard?: boolean | null
          start_location?: Json | null
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
          paper_roadbook?: boolean | null
          password_hash?: string | null
          payment_status?: string
          phone?: string
          profile_photo_url?: string | null
          qr_code?: string
          qr_code_image_url?: string | null
          ride_type?: string
          route_preference?: string | null
          show_on_leaderboard?: boolean | null
          start_location?: Json | null
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
        ]
      }
      push_message_templates: {
        Row: {
          body_template: string
          created_at: string | null
          event_type: string
          id: number
          is_active: boolean | null
          name: string
          title_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string | null
          event_type: string
          id?: number
          is_active?: boolean | null
          name: string
          title_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string | null
          event_type?: string
          id?: number
          is_active?: boolean | null
          name?: string
          title_template?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      push_notifications_history: {
        Row: {
          body: string
          event_data: Json | null
          event_type: string | null
          failed_count: number | null
          id: number
          metadata: Json | null
          recipient_count: number | null
          sent_at: string | null
          sent_by: string | null
          success_count: number | null
          title: string
        }
        Insert: {
          body: string
          event_data?: Json | null
          event_type?: string | null
          failed_count?: number | null
          id?: number
          metadata?: Json | null
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          success_count?: number | null
          title: string
        }
        Update: {
          body?: string
          event_data?: Json | null
          event_type?: string | null
          failed_count?: number | null
          id?: number
          metadata?: Json | null
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          success_count?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_history_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_recipient_groups: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          participant_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          participant_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
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
        ]
      }
      rally_submissions: {
        Row: {
          created_at: string | null
          end_km: number | null
          end_km_locked: boolean | null
          final_score: number | null
          id: string
          long_zones_completed: number | null
          medium_zones_completed: number | null
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
          short_zones_completed: number | null
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
          long_zones_completed?: number | null
          medium_zones_completed?: number | null
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
          short_zones_completed?: number | null
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
          long_zones_completed?: number | null
          medium_zones_completed?: number | null
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
          short_zones_completed?: number | null
          start_km?: number | null
          start_km_locked?: boolean | null
          submitted_at?: string | null
          total_distance?: number | null
          total_points?: number | null
          used_highways?: boolean | null
          weather_bonus?: boolean | null
        }
        Relationships: []
      }
      rally_zone_checkins: {
        Row: {
          checked_in_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          odometer_reading: number | null
          participant_id: string
          zone_id: string
        }
        Insert: {
          checked_in_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          odometer_reading?: number | null
          participant_id: string
          zone_id: string
        }
        Update: {
          checked_in_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          odometer_reading?: number | null
          participant_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rally_zone_checkins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
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
          approved_at: string | null
          approved_by: string | null
          checkpoint_number: number
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
          total_checkpoints: number
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
          checkpoint_number?: number
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
          total_checkpoints?: number
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
          checkpoint_number?: number
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
          total_checkpoints?: number
          updated_at?: string | null
          valid?: boolean | null
          view_score?: number | null
          zone_id?: string
          zone_time_minutes?: number | null
        }
        Relationships: []
      }
      report_history: {
        Row: {
          file_size_bytes: number | null
          file_url: string
          generated_at: string | null
          generated_by: string | null
          id: number
          metadata: Json | null
          participant_id: string | null
          report_type: string
          scheduled_report_id: number | null
        }
        Insert: {
          file_size_bytes?: number | null
          file_url: string
          generated_at?: string | null
          generated_by?: string | null
          id?: number
          metadata?: Json | null
          participant_id?: string | null
          report_type: string
          scheduled_report_id?: number | null
        }
        Update: {
          file_size_bytes?: number | null
          file_url?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: number
          metadata?: Json | null
          participant_id?: string | null
          report_type?: string
          scheduled_report_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_history_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_history_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: number
          metadata: Json | null
          report_type: string
          requested_by: string
          result_url: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          metadata?: Json | null
          report_type: string
          requested_by: string
          result_url?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: number
          metadata?: Json | null
          report_type?: string
          requested_by?: string
          result_url?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_queue_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_stories: {
        Row: {
          created_at: string | null
          excerpt: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          like_count: number | null
          participant_id: string
          published_at: string | null
          sanity_id: string
          slug: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          participant_id: string
          published_at?: string | null
          sanity_id: string
          slug: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          like_count?: number | null
          participant_id?: string
          published_at?: string | null
          sanity_id?: string
          slug?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_stories_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          participant_id: string
          story_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          participant_id: string
          story_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          participant_id?: string
          story_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ride_story_likes: {
        Row: {
          created_at: string | null
          id: string
          participant_id: string
          story_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id: string
          story_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_story_likes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "ride_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string
          email_list: string[]
          frequency: string
          id: number
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          report_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email_list: string[]
          frequency: string
          id?: number
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          report_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email_list?: string[]
          frequency?: string
          id?: number
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          report_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_run_time: {
        Args: { p_current_time?: string; p_frequency?: string }
        Returns: string
      }
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
      get_nearby_buddies: {
        Args: { p_latitude: number; p_longitude: number; p_radius_km?: number }
        Returns: {
          distance_km: number
          last_checkin_lat: number
          last_checkin_lng: number
          last_checkin_time: string
          participant_id: number
          participant_name: string
        }[]
      }
      get_participant_report_data: {
        Args: { p_participant_id: number }
        Returns: Json
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
      get_rally_zone_progress: {
        Args: { participant_uuid: string }
        Returns: {
          check_in_time: string
          check_out_time: string
          checked_in: boolean
          checked_out: boolean
          duration_minutes: number
          rally_zone_id: string
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_participant_shadow_scores: {
        Args: { p_participant_id: string }
        Returns: undefined
      }
      update_scheduled_report_after_run: {
        Args: { p_scheduled_report_id: number }
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
