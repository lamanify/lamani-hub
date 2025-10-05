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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          consent_given: boolean
          consent_ip: string | null
          consent_timestamp: string | null
          created_at: string
          created_by: string | null
          custom: Json | null
          email: string | null
          id: string
          modified_by: string | null
          name: string
          phone: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consent_given?: boolean
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          created_by?: string | null
          custom?: Json | null
          email?: string | null
          id?: string
          modified_by?: string | null
          name: string
          phone: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consent_given?: boolean
          consent_ip?: string | null
          consent_timestamp?: string | null
          created_at?: string
          created_by?: string | null
          custom?: Json | null
          email?: string | null
          id?: string
          modified_by?: string | null
          name?: string
          phone?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_stripe_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_definitions: {
        Row: {
          created_at: string | null
          data_type: string
          description: string | null
          entity: string
          id: string
          is_required: boolean | null
          is_sensitive: boolean | null
          is_system: boolean
          key: string
          label: string
          last_seen_at: string | null
          options: Json | null
          show_in_form: boolean | null
          show_in_list: boolean | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          data_type?: string
          description?: string | null
          entity?: string
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          is_system?: boolean
          key: string
          label: string
          last_seen_at?: string | null
          options?: Json | null
          show_in_form?: boolean | null
          show_in_list?: boolean | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          description?: string | null
          entity?: string
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          is_system?: boolean
          key?: string
          label?: string
          last_seen_at?: string | null
          options?: Json | null
          show_in_form?: boolean | null
          show_in_list?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_config: {
        Row: {
          created_at: string
          grace_period_days: number
          id: string
          plan_type: string
          trial_duration_days: number
        }
        Insert: {
          created_at?: string
          grace_period_days?: number
          id?: string
          plan_type: string
          trial_duration_days?: number
        }
        Update: {
          created_at?: string
          grace_period_days?: number
          id?: string
          plan_type?: string
          trial_duration_days?: number
        }
        Relationships: []
      }
      tenants: {
        Row: {
          api_key: string | null
          api_key_hash: string | null
          api_key_prefix: string | null
          billing_email: string | null
          comp_expires_at: string | null
          comp_reason: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          dpo_email: string | null
          dpo_name: string | null
          dpo_phone: string | null
          grace_period_ends_at: string | null
          id: string
          is_comped: boolean | null
          name: string
          old_api_key_expires_at: string | null
          old_api_key_hash: string | null
          plan_code: string | null
          plan_type: string | null
          seat_limit: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_key_hash?: string | null
          api_key_prefix?: string | null
          billing_email?: string | null
          comp_expires_at?: string | null
          comp_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dpo_email?: string | null
          dpo_name?: string | null
          dpo_phone?: string | null
          grace_period_ends_at?: string | null
          id?: string
          is_comped?: boolean | null
          name: string
          old_api_key_expires_at?: string | null
          old_api_key_hash?: string | null
          plan_code?: string | null
          plan_type?: string | null
          seat_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_key_hash?: string | null
          api_key_prefix?: string | null
          billing_email?: string | null
          comp_expires_at?: string | null
          comp_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dpo_email?: string | null
          dpo_name?: string | null
          dpo_phone?: string | null
          grace_period_ends_at?: string | null
          id?: string
          is_comped?: boolean | null
          name?: string
          old_api_key_expires_at?: string | null
          old_api_key_hash?: string | null
          plan_code?: string | null
          plan_type?: string | null
          seat_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_type_fkey"
            columns: ["plan_type"]
            isOneToOne: false
            referencedRelation: "subscription_config"
            referencedColumns: ["plan_type"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          lead_id: string | null
          payload_raw: Json
          source: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          lead_id?: string | null
          payload_raw: Json
          source: string
          status: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          lead_id?: string | null
          payload_raw?: Json
          source?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_suspend_expired_grace_periods: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_tenant_safe: {
        Args: { p_user_id: string }
        Returns: {
          comp_expires_at: string
          created_at: string
          grace_period_ends_at: string
          id: string
          is_comped: boolean
          name: string
          plan_code: string
          plan_type: string
          subscription_current_period_end: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          updated_at: string
        }[]
      }
      get_user_tenant_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_property_usage: {
        Args: { p_entity: string; p_key: string; p_tenant_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      lead_status:
        | "new_inquiry"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
      subscription_status:
        | "trial"
        | "active"
        | "cancelled"
        | "past_due"
        | "suspended"
        | "inactive"
        | "trialing"
        | "canceled"
        | "comped"
      user_role:
        | "super_admin"
        | "clinic_admin"
        | "clinic_user"
        | "view_only"
        | "tenant_owner"
        | "tenant_admin"
        | "tenant_member"
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
      lead_status: [
        "new_inquiry",
        "contacted",
        "qualified",
        "converted",
        "lost",
      ],
      subscription_status: [
        "trial",
        "active",
        "cancelled",
        "past_due",
        "suspended",
        "inactive",
        "trialing",
        "canceled",
        "comped",
      ],
      user_role: [
        "super_admin",
        "clinic_admin",
        "clinic_user",
        "view_only",
        "tenant_owner",
        "tenant_admin",
        "tenant_member",
      ],
    },
  },
} as const
