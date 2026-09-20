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
      artwork_tags: {
        Row: {
          artwork_id: string
          tag_id: string
        }
        Insert: {
          artwork_id: string
          tag_id: string
        }
        Update: {
          artwork_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_tags_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          category_id: string | null
          colors: string[] | null
          created_at: string
          credit_cost: number
          description: string | null
          download_count: number
          external_url: string | null
          file_format: string | null
          file_path: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          is_trending: boolean
          preview_url: string
          price_cents: number
          slug: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          credit_cost?: number
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          preview_url: string
          price_cents?: number
          slug: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          credit_cost?: number
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          preview_url?: string
          price_cents?: number
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "artworks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          artwork_id: string
          download_count: number
          first_downloaded_at: string
          id: string
          last_downloaded_at: string
          source: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          download_count?: number
          first_downloaded_at?: string
          id?: string
          last_downloaded_at?: string
          source?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          download_count?: number
          first_downloaded_at?: string
          id?: string
          last_downloaded_at?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloads_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          artwork_id: string
          created_at: string
          id: string
          paid_at: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          provider: string
          provider_payment_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          artwork_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          artwork_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          description: string | null
          features: Json
          id: string
          is_active: boolean
          monthly_credits: number
          name: string
          price_cents: number
          sort_order: number
          stripe_price_id: string | null
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Insert: {
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits: number
          name: string
          price_cents: number
          sort_order?: number
          stripe_price_id?: string | null
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Update: {
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_credits?: number
          name?: string
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          credits_remaining: number
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          admin_reply: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
      consume_download: {
        Args: { _artwork_id: string }
        Returns: {
          credits_remaining: number
          external_url: string
          file_path: string
          was_new: boolean
        }[]
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
      app_role: "admin" | "customer"
      order_status: "pending" | "paid" | "failed" | "refunded"
      plan_tier: "lite" | "pro" | "plus"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
      support_status: "new" | "in_progress" | "resolved"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "customer"],
      order_status: ["pending", "paid", "failed", "refunded"],
      plan_tier: ["lite", "pro", "plus"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      support_status: ["new", "in_progress", "resolved"],
    },
  },
} as const
