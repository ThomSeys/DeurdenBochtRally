export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          phone: string
          motorcycle_brand: string
          motorcycle_model: string
          license_plate: string
          formula: 'with_meals' | 'breakfast_only'
          amount_paid: number
          payment_status: 'pending' | 'completed' | 'failed'
          stripe_payment_id: string | null
          qr_code: string
          checked_in: boolean
          ride_type: 'free' | 'guided'
          allow_early_access: boolean
          password_hash: string
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          first_name: string
          last_name: string
          phone: string
          motorcycle_brand: string
          motorcycle_model: string
          license_plate: string
          formula: 'with_meals' | 'breakfast_only'
          amount_paid: number
          payment_status?: 'pending' | 'completed' | 'failed'
          stripe_payment_id?: string | null
          qr_code?: string
          checked_in?: boolean
          ride_type: 'free' | 'guided'
          allow_early_access?: boolean
          password_hash: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          motorcycle_brand?: string
          motorcycle_model?: string
          license_plate?: string
          formula?: 'with_meals' | 'breakfast_only'
          amount_paid?: number
          payment_status?: 'pending' | 'completed' | 'failed'
          stripe_payment_id?: string | null
          qr_code?: string
          checked_in?: boolean
          allow_early_access?: boolean
          ride_type?: 'free' | 'guided'
          password_hash?: string
        }
      }
      rally_submissions: {
        Row: {
          id: string
          participant_id: string
          created_at: string
          rz1_code: string | null
          rz2_code: string | null
          rz3_code: string | null
          rz4_code: string | null
          rz5_code: string | null
          rz6_code: string | null
          rz7_code: string | null
          rz8_code: string | null
          total_distance: number | null
          used_highways: boolean
          weather_bonus: boolean
          total_points: number
          submitted_at: string | null
        }
        Insert: {
          id?: string
          participant_id: string
          created_at?: string
          rz1_code?: string | null
          rz2_code?: string | null
          rz3_code?: string | null
          rz4_code?: string | null
          rz5_code?: string | null
          rz6_code?: string | null
          rz7_code?: string | null
          rz8_code?: string | null
          total_distance?: number | null
          used_highways?: boolean
          weather_bonus?: boolean
          total_points?: number
          submitted_at?: string | null
        }
        Update: {
          id?: string
          participant_id?: string
          created_at?: string
          rz1_code?: string | null
          rz2_code?: string | null
          rz3_code?: string | null
          rz4_code?: string | null
          rz5_code?: string | null
          rz6_code?: string | null
          rz7_code?: string | null
          rz8_code?: string | null
          total_distance?: number | null
          used_highways?: boolean
          weather_bonus?: boolean
          total_points?: number
          submitted_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          file_url: string
          file_type: 'gpx' | 'pdf' | 'image' | 'other'
          category: 'route' | 'rally_book' | 'map' | 'instruction' | 'other'
          visible_to_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          file_url: string
          file_type: 'gpx' | 'pdf' | 'image' | 'other'
          category: 'route' | 'rally_book' | 'map' | 'instruction' | 'other'
          visible_to_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: 'gpx' | 'pdf' | 'image' | 'other'
          category?: 'route' | 'rally_book' | 'map' | 'instruction' | 'other'
          visible_to_public?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
