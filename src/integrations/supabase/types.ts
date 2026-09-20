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
      artwork_categories: {
        Row: {
          artwork_id: string
          category_id: string
        }
        Insert: {
          artwork_id: string
          category_id: string
        }
        Update: {
          artwork_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_categories_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
          featured_order: number
          file_format: string | null
          file_path: string | null
          gallery_urls: string[]
          id: string
          is_featured: boolean
          is_published: boolean
          is_trending: boolean
          preview_url: string
          price_cents: number
          product_code: string | null
          seo_description: string | null
          seo_keyword: string | null
          seo_title: string | null
          slug: string
          title: string
          translations: Json
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
          featured_order?: number
          file_format?: string | null
          file_path?: string | null
          gallery_urls?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          preview_url: string
          price_cents?: number
          product_code?: string | null
          seo_description?: string | null
          seo_keyword?: string | null
          seo_title?: string | null
          slug: string
          title: string
          translations?: Json
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
          featured_order?: number
          file_format?: string | null
          file_path?: string | null
          gallery_urls?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          is_trending?: boolean
          preview_url?: string
          price_cents?: number
          product_code?: string | null
          seo_description?: string | null
          seo_keyword?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          translations?: Json
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
      banners: {
        Row: {
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          translations: Json
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
          translations?: Json
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
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          artwork_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
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
          translations: Json
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
          translations?: Json
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
          translations?: Json
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
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_cents: number
          id: string
          order_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_cents?: number
          id?: string
          order_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_cents?: number
          id?: string
          order_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          once_per_user: boolean
          scope: Database["public"]["Enums"]["coupon_scope"]
          stripe_coupon_id: string | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          once_per_user?: boolean
          scope?: Database["public"]["Enums"]["coupon_scope"]
          stripe_coupon_id?: string | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          once_per_user?: boolean
          scope?: Database["public"]["Enums"]["coupon_scope"]
          stripe_coupon_id?: string | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
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
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          provider_message_id: string | null
          related_order_id: string | null
          related_user_id: string | null
          sent_by: string | null
          status: string
          subject: string | null
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          provider_message_id?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          provider_message_id?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          artwork_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      home_section_items: {
        Row: {
          artwork_id: string
          created_at: string
          id: string
          section_id: string
          sort_order: number
        }
        Insert: {
          artwork_id: string
          created_at?: string
          id?: string
          section_id: string
          sort_order?: number
        }
        Update: {
          artwork_id?: string
          created_at?: string
          id?: string
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "home_section_items_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "home_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          item_limit: number
          section_type: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_limit?: number
          section_type: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_limit?: number
          section_type?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          message: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          message?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          message?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          artwork_id: string | null
          coupon_code: string | null
          created_at: string
          discount_cents: number
          id: string
          items: Json | null
          order_number: number
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
          artwork_id?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          items?: Json | null
          order_number?: number
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
          artwork_id?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          items?: Json | null
          order_number?: number
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
          phone: string | null
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
          phone?: string | null
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
          phone?: string | null
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          artwork_id: string
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_verified: boolean
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified?: boolean
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified?: boolean
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          facebook_url: string | null
          favicon_url: string | null
          footer_text: string | null
          ga4_measurement_id: string | null
          google_search_console_id: string | null
          id: boolean
          instagram_url: string | null
          legal_business_name: string | null
          legal_document: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          primary_color: string | null
          promo_banner_enabled: boolean
          promo_banner_link: string | null
          promo_banner_text: string | null
          site_name: string
          support_email: string | null
          tagline: string | null
          tiktok_url: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          facebook_url?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          ga4_measurement_id?: string | null
          google_search_console_id?: string | null
          id?: boolean
          instagram_url?: string | null
          legal_business_name?: string | null
          legal_document?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          primary_color?: string | null
          promo_banner_enabled?: boolean
          promo_banner_link?: string | null
          promo_banner_text?: string | null
          site_name?: string
          support_email?: string | null
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          facebook_url?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          ga4_measurement_id?: string | null
          google_search_console_id?: string | null
          id?: boolean
          instagram_url?: string | null
          legal_business_name?: string | null
          legal_document?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          primary_color?: string | null
          promo_banner_enabled?: boolean
          promo_banner_link?: string | null
          promo_banner_text?: string | null
          site_name?: string
          support_email?: string | null
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
          whatsapp?: string | null
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
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
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
          translations: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          translations?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          translations?: Json
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
      admin_get_artwork_external_url: {
        Args: { _artwork_id: string }
        Returns: string
      }
      consume_download: {
        Args: { _artwork_id: string }
        Returns: {
          credits_remaining: number
          external_url: string
          file_path: string
          was_new: boolean
        }[]
      }
      grant_order_downloads: { Args: { _order_id: string }; Returns: undefined }
      has_purchased_or_downloaded: {
        Args: { _artwork_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: { _code: string; _scope: string; _subtotal_cents: number }
        Returns: {
          coupon_id: string
          discount_cents: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      coupon_discount_type: "percent" | "fixed"
      coupon_scope: "subscription" | "pix" | "both"
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
      coupon_discount_type: ["percent", "fixed"],
      coupon_scope: ["subscription", "pix", "both"],
      order_status: ["pending", "paid", "failed", "refunded"],
      plan_tier: ["lite", "pro", "plus"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
      support_status: ["new", "in_progress", "resolved"],
    },
  },
} as const
