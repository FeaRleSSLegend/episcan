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
      anonymous_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          sender_user_id: string
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          sender_user_id: string
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          sender_user_id?: string
          subject?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          student_user_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          student_user_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          student_user_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          anonymous_message_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_type: string
          sender_user_id: string
        }
        Insert: {
          anonymous_message_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_type: string
          sender_user_id: string
        }
        Update: {
          anonymous_message_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_type?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_anonymous_message_id_fkey"
            columns: ["anonymous_message_id"]
            isOneToOne: false
            referencedRelation: "anonymous_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_links: {
        Row: {
          child_user_id: string
          id: string
          linked_at: string
          parent_user_id: string
        }
        Insert: {
          child_user_id: string
          id?: string
          linked_at?: string
          parent_user_id: string
        }
        Update: {
          child_user_id?: string
          id?: string
          linked_at?: string
          parent_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          grade_class: string | null
          id: string
          phone: string | null
          school_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          grade_class?: string | null
          id?: string
          phone?: string | null
          school_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          grade_class?: string | null
          id?: string
          phone?: string | null
          school_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_audit_logs: {
        Row: {
          action: string
          changed_by: string
          changed_by_email: string | null
          created_at: string
          id: string
          new_role: string
          previous_role: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          action?: string
          changed_by: string
          changed_by_email?: string | null
          created_at?: string
          id?: string
          new_role: string
          previous_role?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          changed_by_email?: string | null
          created_at?: string
          id?: string
          new_role?: string
          previous_role?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reported_at: string
          severity: string
          symptoms: string[]
          temperature: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reported_at?: string
          severity?: string
          symptoms?: string[]
          temperature?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reported_at?: string
          severity?: string
          symptoms?: string[]
          temperature?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      generate_invite_code: { Args: never; Returns: string }
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
    }
    Enums: {
      app_role: "student" | "parent" | "health_officer" | "admin"
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
      app_role: ["student", "parent", "health_officer", "admin"],
    },
  },
} as const
