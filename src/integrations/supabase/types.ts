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
          code: string
          description: string
          icon: string | null
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          description: string
          icon?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          description?: string
          icon?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          detail: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          detail?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      country_challenges: {
        Row: {
          action_prompt: string | null
          approved_at: string | null
          brief: string | null
          country: string
          created_at: string
          day_number: number
          generated_at: string | null
          prompt: string | null
          small_sample: boolean | null
          source_research_ids: string[] | null
          status: string
          submission_count: number | null
          success_criteria: string | null
          summary: string | null
          theme: string
          title: string | null
          updated_at: string
          year: number
        }
        Insert: {
          action_prompt?: string | null
          approved_at?: string | null
          brief?: string | null
          country: string
          created_at?: string
          day_number: number
          generated_at?: string | null
          prompt?: string | null
          small_sample?: boolean | null
          source_research_ids?: string[] | null
          status?: string
          submission_count?: number | null
          success_criteria?: string | null
          summary?: string | null
          theme: string
          title?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          action_prompt?: string | null
          approved_at?: string | null
          brief?: string | null
          country?: string
          created_at?: string
          day_number?: number
          generated_at?: string | null
          prompt?: string | null
          small_sample?: boolean | null
          source_research_ids?: string[] | null
          status?: string
          submission_count?: number | null
          success_criteria?: string | null
          summary?: string | null
          theme?: string
          title?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string
          first_submission_at: string | null
          full_name: string | null
          id: string
          participant_number: string
          points: number
          role: Database["public"]["Enums"]["app_role"]
          school: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          first_submission_at?: string | null
          full_name?: string | null
          id: string
          participant_number?: string
          points?: number
          role?: Database["public"]["Enums"]["app_role"]
          school?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          first_submission_at?: string | null
          full_name?: string | null
          id?: string
          participant_number?: string
          points?: number
          role?: Database["public"]["Enums"]["app_role"]
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_themes: {
        Row: {
          created_at: string
          day_number: number
          is_milestone: boolean
          is_rest_day: boolean
          prompt: string | null
          theme: string
          year: number
        }
        Insert: {
          created_at?: string
          day_number: number
          is_milestone?: boolean
          is_rest_day?: boolean
          prompt?: string | null
          theme: string
          year: number
        }
        Update: {
          created_at?: string
          day_number?: number
          is_milestone?: boolean
          is_rest_day?: boolean
          prompt?: string | null
          theme?: string
          year?: number
        }
        Relationships: []
      }
      regional_contexts: {
        Row: {
          context_body: string
          context_headline: string
          country: string
          created_at: string
          day_number: number
          id: string
          priority: string | null
          theme: string
          updated_at: string
          year: number
        }
        Insert: {
          context_body: string
          context_headline: string
          country: string
          created_at?: string
          day_number: number
          id?: string
          priority?: string | null
          theme: string
          updated_at?: string
          year?: number
        }
        Update: {
          context_body?: string
          context_headline?: string
          country?: string
          created_at?: string
          day_number?: number
          id?: string
          priority?: string | null
          theme?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      submissions: {
        Row: {
          ai_feedback: string | null
          ai_next_steps: string | null
          attachment_paths: string[] | null
          country: string | null
          data_sources: string | null
          day_number: number | null
          description: string | null
          id: string
          key_findings: string | null
          location: string | null
          media_url: string | null
          phase: string
          source_links: string[] | null
          status: string
          submitted_at: string
          theme: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_next_steps?: string | null
          attachment_paths?: string[] | null
          country?: string | null
          data_sources?: string | null
          day_number?: number | null
          description?: string | null
          id?: string
          key_findings?: string | null
          location?: string | null
          media_url?: string | null
          phase: string
          source_links?: string[] | null
          status?: string
          submitted_at?: string
          theme: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_next_steps?: string | null
          attachment_paths?: string[] | null
          country?: string | null
          data_sources?: string | null
          day_number?: number | null
          description?: string | null
          id?: string
          key_findings?: string | null
          location?: string | null
          media_url?: string | null
          phase?: string
          source_links?: string[] | null
          status?: string
          submitted_at?: string
          theme?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          code: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      country_leaderboard: {
        Args: never
        Returns: {
          country: string
          participants: number
          rank: number
          total_points: number
        }[]
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      individual_leaderboard: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          country: string
          full_name: string
          id: string
          participant_number: string
          points: number
          rank: number
        }[]
      }
      user_rank: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
