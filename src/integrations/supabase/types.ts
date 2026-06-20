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
      admin_actions: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_country: string | null
          target_day_number: number | null
          target_theme: string | null
          target_type: string | null
          target_year: number | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_country?: string | null
          target_day_number?: number | null
          target_theme?: string | null
          target_type?: string | null
          target_year?: number | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_country?: string | null
          target_day_number?: number | null
          target_theme?: string | null
          target_type?: string | null
          target_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_actor_id_fkey"
            columns: ["actor_id"]
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
      country_challenges: {
        Row: {
          action_prompt: string | null
          approved_at: string | null
          approved_by: string | null
          brief: string | null
          country: string
          created_at: string
          day_number: number
          generated_at: string | null
          prompt: string | null
          small_sample: boolean
          source_research_ids: string[]
          status: Database["public"]["Enums"]["country_challenge_status"]
          submission_count: number
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
          approved_by?: string | null
          brief?: string | null
          country: string
          created_at?: string
          day_number: number
          generated_at?: string | null
          prompt?: string | null
          small_sample?: boolean
          source_research_ids?: string[]
          status?: Database["public"]["Enums"]["country_challenge_status"]
          submission_count?: number
          success_criteria?: string | null
          summary?: string | null
          theme: string
          title?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          action_prompt?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brief?: string | null
          country?: string
          created_at?: string
          day_number?: number
          generated_at?: string | null
          prompt?: string | null
          small_sample?: boolean
          source_research_ids?: string[]
          status?: Database["public"]["Enums"]["country_challenge_status"]
          submission_count?: number
          success_criteria?: string | null
          summary?: string | null
          theme?: string
          title?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "country_challenges_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          school?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
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
          is_rest_day: boolean
          prompt: string | null
          theme: string
          year: number
        }
        Insert: {
          created_at?: string
          day_number: number
          is_rest_day?: boolean
          prompt?: string | null
          theme: string
          year?: number
        }
        Update: {
          created_at?: string
          day_number?: number
          is_rest_day?: boolean
          prompt?: string | null
          theme?: string
          year?: number
        }
        Relationships: []
      }
      submission_links: {
        Row: {
          created_at: string
          policy_submission_id: string
          research_submission_id: string
        }
        Insert: {
          created_at?: string
          policy_submission_id: string
          research_submission_id: string
        }
        Update: {
          created_at?: string
          policy_submission_id?: string
          research_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_links_policy_submission_id_fkey"
            columns: ["policy_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_links_research_submission_id_fkey"
            columns: ["research_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_feedback: string | null
          ai_next_steps: string | null
          attachment_paths: string[]
          country: string | null
          data_sources: string | null
          day_number: number | null
          description: string | null
          id: string
          key_findings: string | null
          location: string | null
          media_url: string | null
          phase: Database["public"]["Enums"]["submission_phase"]
          reviewed_at: string | null
          source_links: string[]
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          theme: string
          title: string
          type: Database["public"]["Enums"]["submission_type"]
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_next_steps?: string | null
          attachment_paths?: string[]
          country?: string | null
          data_sources?: string | null
          day_number?: number | null
          description?: string | null
          id?: string
          key_findings?: string | null
          location?: string | null
          media_url?: string | null
          phase: Database["public"]["Enums"]["submission_phase"]
          reviewed_at?: string | null
          source_links?: string[]
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          theme: string
          title: string
          type: Database["public"]["Enums"]["submission_type"]
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_next_steps?: string | null
          attachment_paths?: string[]
          country?: string | null
          data_sources?: string | null
          day_number?: number | null
          description?: string | null
          id?: string
          key_findings?: string | null
          location?: string | null
          media_url?: string | null
          phase?: Database["public"]["Enums"]["submission_phase"]
          reviewed_at?: string | null
          source_links?: string[]
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          theme?: string
          title?: string
          type?: Database["public"]["Enums"]["submission_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin"
      country_challenge_status:
        | "pending"
        | "generating"
        | "ready"
        | "failed"
        | "approved"
      submission_phase: "october_research" | "november_action"
      submission_status: "submitted" | "reviewed"
      submission_type: "regional_audit" | "policy_change"
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
      app_role: ["student", "admin"],
      country_challenge_status: [
        "pending",
        "generating",
        "ready",
        "failed",
        "approved",
      ],
      submission_phase: ["october_research", "november_action"],
      submission_status: ["submitted", "reviewed"],
      submission_type: ["regional_audit", "policy_change"],
    },
  },
} as const
