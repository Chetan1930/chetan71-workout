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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      equipment: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      exercise_alternatives: {
        Row: {
          alternative_id: string
          boost: number
          created_at: string
          exercise_id: string
          id: string
          reason: string | null
        }
        Insert: {
          alternative_id: string
          boost?: number
          created_at?: string
          exercise_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          alternative_id?: string
          boost?: number
          created_at?: string
          exercise_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_alternatives_alternative_id_fkey"
            columns: ["alternative_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_alternatives_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_media: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          media_type: string
          order_index: number
          url: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          media_type?: string
          order_index?: number
          url: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          media_type?: string
          order_index?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_media_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_secondary_muscles: {
        Row: {
          exercise_id: string
          muscle_group_id: string
        }
        Insert: {
          exercise_id: string
          muscle_group_id: string
        }
        Update: {
          exercise_id?: string
          muscle_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_secondary_muscles_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_secondary_muscles_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          common_mistakes: string[]
          created_at: string
          description: string | null
          difficulty: number
          equipment_id: string | null
          fatigue_score: number
          gif_url: string | null
          id: string
          image_url: string | null
          instructions: string[]
          is_active: boolean
          movement_pattern_id: string | null
          name: string
          primary_muscle_id: string
          slug: string
          stability_requirement: number
          tips: string[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          common_mistakes?: string[]
          created_at?: string
          description?: string | null
          difficulty?: number
          equipment_id?: string | null
          fatigue_score?: number
          gif_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[]
          is_active?: boolean
          movement_pattern_id?: string | null
          name: string
          primary_muscle_id: string
          slug: string
          stability_requirement?: number
          tips?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          common_mistakes?: string[]
          created_at?: string
          description?: string | null
          difficulty?: number
          equipment_id?: string | null
          fatigue_score?: number
          gif_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[]
          is_active?: boolean
          movement_pattern_id?: string | null
          name?: string
          primary_muscle_id?: string
          slug?: string
          stability_requirement?: number
          tips?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_movement_pattern_id_fkey"
            columns: ["movement_pattern_id"]
            isOneToOne: false
            referencedRelation: "movement_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_primary_muscle_id_fkey"
            columns: ["primary_muscle_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_patterns: {
        Row: {
          created_at: string
          default_instructions: string[]
          default_mistakes: string[]
          default_tips: string[]
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          default_instructions?: string[]
          default_mistakes?: string[]
          default_tips?: string[]
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          default_instructions?: string[]
          default_mistakes?: string[]
          default_tips?: string[]
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      muscle_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          region: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          unit: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_substitutions: {
        Row: {
          created_at: string
          id: string
          replacement_exercise_id: string
          session_id: string
          user_id: string
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          replacement_exercise_id: string
          session_id: string
          user_id: string
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          id?: string
          replacement_exercise_id?: string
          session_id?: string
          user_id?: string
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_substitutions_replacement_exercise_id_fkey"
            columns: ["replacement_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_substitutions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_substitutions_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipment: {
        Row: {
          available: boolean
          equipment_id: string
          user_id: string
        }
        Insert: {
          available?: boolean
          equipment_id: string
          user_id: string
        }
        Update: {
          available?: boolean
          equipment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
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
          role: Database["public"]["Enums"]["app_role"]
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
      workout_days: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          is_active: boolean
          is_rest_day: boolean
          name: string
          order_index: number
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          is_rest_day?: boolean
          name: string
          order_index?: number
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          is_rest_day?: boolean
          name?: string
          order_index?: number
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_active: boolean
          muscle_group_id: string | null
          notes: string | null
          order_index: number
          rest_seconds: number
          target_reps: string
          target_sets: number
          updated_at: string
          workout_day_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_active?: boolean
          muscle_group_id?: string | null
          notes?: string | null
          order_index?: number
          rest_seconds?: number
          target_reps?: string
          target_sets?: number
          updated_at?: string
          workout_day_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_active?: boolean
          muscle_group_id?: string | null
          notes?: string | null
          order_index?: number
          rest_seconds?: number
          target_reps?: string
          target_sets?: number
          updated_at?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_muscle_group_id_fkey"
            columns: ["muscle_group_id"]
            isOneToOne: false
            referencedRelation: "muscle_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          owner_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          owner_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          owner_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          session_date: string
          started_at: string
          updated_at: string
          user_id: string
          workout_day_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          started_at?: string
          updated_at?: string
          user_id: string
          workout_day_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          started_at?: string
          updated_at?: string
          user_id?: string
          workout_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          performed_at: string
          reps: number | null
          rir: number | null
          session_id: string
          set_number: number
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          performed_at?: string
          reps?: number | null
          rir?: number | null
          session_id: string
          set_number?: number
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          performed_at?: string
          reps?: number | null
          rir?: number | null
          session_id?: string
          set_number?: number
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_plan: { Args: { _plan_id: string }; Returns: boolean }
      can_write_plan: { Args: { _plan_id: string }; Returns: boolean }
      claim_admin_if_none: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      last_exercise_performance: {
        Args: { _exercise_id: string }
        Returns: {
          reps: number
          rir: number
          session_date: string
          set_number: number
          weight: number
        }[]
      }
      plan_of_day: { Args: { _day_id: string }; Returns: string }
      rank_exercise_alternatives: {
        Args: {
          _equipment_slugs?: string[]
          _exercise_id: string
          _limit?: number
        }
        Returns: {
          difficulty: number
          equipment: string
          fatigue_score: number
          gif_url: string
          id: string
          image_url: string
          movement_pattern: string
          name: string
          primary_muscle: string
          reason: string
          similarity: number
          slug: string
        }[]
      }
      workout_streak: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
