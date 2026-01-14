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
      career_memory: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          memory_type: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          memory_type: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          memory_type?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_schedules: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          interview_type: string | null
          notes: string | null
          opportunity_id: string
          reminder_sent: boolean | null
          scheduled_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          notes?: string | null
          opportunity_id: string
          reminder_sent?: boolean | null
          scheduled_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          interview_type?: string | null
          notes?: string | null
          opportunity_id?: string
          reminder_sent?: boolean | null
          scheduled_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_schedules_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          company: string | null
          completed_at: string | null
          created_at: string | null
          feedback: Json | null
          id: string
          messages: Json | null
          role: string
          score: number | null
          user_id: string
        }
        Insert: {
          company?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          messages?: Json | null
          role: string
          score?: number | null
          user_id: string
        }
        Update: {
          company?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          messages?: Json | null
          role?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          metadata: Json | null
          notification_type: string
          reference_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          notification_type: string
          reference_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          notification_type?: string
          reference_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string | null
          deadline: string | null
          description: string | null
          fit_score: number | null
          id: string
          location: string | null
          notes: string | null
          requirements: string[] | null
          salary_range: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          fit_score?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          fit_score?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          career_readiness_score: number | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string | null
          goals: string[] | null
          id: string
          interests: string[] | null
          notification_preferences: Json | null
          resume_url: string | null
          target_role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          career_readiness_score?: number | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          goals?: string[] | null
          id: string
          interests?: string[] | null
          notification_preferences?: Json | null
          resume_url?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          career_readiness_score?: number | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string | null
          goals?: string[] | null
          id?: string
          interests?: string[] | null
          notification_preferences?: Json | null
          resume_url?: string | null
          target_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roadmap_milestones: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          skill_id: string | null
          title: string
          user_id: string
          week_number: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          skill_id?: string | null
          title: string
          user_id: string
          week_number?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          skill_id?: string | null
          title?: string
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_milestones_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          proficiency: number | null
          status: Database["public"]["Enums"]["skill_status"] | null
          target_proficiency: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          proficiency?: number | null
          status?: Database["public"]["Enums"]["skill_status"] | null
          target_proficiency?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          proficiency?: number | null
          status?: Database["public"]["Enums"]["skill_status"] | null
          target_proficiency?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "interviewing"
        | "offered"
        | "rejected"
        | "accepted"
      experience_level: "entry" | "junior" | "mid" | "senior" | "lead"
      skill_status: "not_started" | "in_progress" | "completed"
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
      application_status: [
        "saved",
        "applied",
        "interviewing",
        "offered",
        "rejected",
        "accepted",
      ],
      experience_level: ["entry", "junior", "mid", "senior", "lead"],
      skill_status: ["not_started", "in_progress", "completed"],
    },
  },
} as const
