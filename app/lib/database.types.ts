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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country_code: string
          created_at: string
          id: string
          is_default: boolean
          phone: string
          pincode: string
          recipient_name: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          phone: string
          pincode: string
          recipient_name: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          phone?: string
          pincode?: string
          recipient_name?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          colour_snapshot: string
          created_at: string
          id: string
          image_url_snapshot: string | null
          price_paise_snapshot: number
          product_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          colour_snapshot: string
          created_at?: string
          id?: string
          image_url_snapshot?: string | null
          price_paise_snapshot: number
          product_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          colour_snapshot?: string
          created_at?: string
          id?: string
          image_url_snapshot?: string | null
          price_paise_snapshot?: number
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          size_snapshot?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          expires_at: string | null
          guest_token_hash: string | null
          id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          guest_token_hash?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          guest_token_hash?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          amount_paise: number | null
          code: string
          created_at: string
          discount_type: string
          ends_at: string | null
          id: string
          is_active: boolean
          maximum_discount_paise: number | null
          minimum_subtotal_paise: number
          percentage_basis_points: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          amount_paise?: number | null
          code: string
          created_at?: string
          discount_type: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          maximum_discount_paise?: number | null
          minimum_subtotal_paise?: number
          percentage_basis_points?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_paise?: number | null
          code?: string
          created_at?: string
          discount_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          maximum_discount_paise?: number | null
          minimum_subtotal_paise?: number
          percentage_basis_points?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          low_stock_threshold: number
          stock_quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          low_stock_threshold?: number
          stock_quantity?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          low_stock_threshold?: number
          stock_quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          order_id: string | null
          quantity_change: number
          reason: string
          variant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          quantity_change: number
          reason: string
          variant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          quantity_change?: number
          reason?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          quantity: number
          status: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          order_id: string
          quantity: number
          status?: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          quantity?: number
          status?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          created_at: string
          deduplication_key: string
          delivery_status: string
          event_type: string
          id: string
          last_error: string | null
          order_id: string | null
          retry_count: number
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          deduplication_key: string
          delivery_status?: string
          event_type: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          retry_count?: number
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          deduplication_key?: string
          delivery_status?: string
          event_type?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          retry_count?: number
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_access_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          order_id: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_access_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          allocated_discount_paise: number
          colour_snapshot: string
          created_at: string
          id: string
          image_url_snapshot: string | null
          line_total_paise: number
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_paise: number
          variant_id: string
        }
        Insert: {
          allocated_discount_paise?: number
          colour_snapshot: string
          created_at?: string
          id?: string
          image_url_snapshot?: string | null
          line_total_paise: number
          order_id: string
          product_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot: string
          sku_snapshot: string
          unit_price_paise: number
          variant_id: string
        }
        Update: {
          allocated_discount_paise?: number
          colour_snapshot?: string
          created_at?: string
          id?: string
          image_url_snapshot?: string | null
          line_total_paise?: number
          order_id?: string
          product_id?: string
          product_name_snapshot?: string
          quantity?: number
          size_snapshot?: string
          sku_snapshot?: string
          unit_price_paise?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          new_status: string
          order_id: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status: string
          order_id: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: string
          order_id?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          checkout_idempotency_key: string
          contact_email: string
          created_at: string
          currency: string
          discount_paise: number
          discount_snapshot: Json | null
          fulfilment_status: string
          id: string
          order_number: string
          payment_status: string
          shipping_address_snapshot: Json
          shipping_paise: number
          subtotal_paise: number
          total_paise: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checkout_idempotency_key?: string
          contact_email: string
          created_at?: string
          currency?: string
          discount_paise?: number
          discount_snapshot?: Json | null
          fulfilment_status?: string
          id?: string
          order_number: string
          payment_status?: string
          shipping_address_snapshot: Json
          shipping_paise?: number
          subtotal_paise: number
          total_paise: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checkout_idempotency_key?: string
          contact_email?: string
          created_at?: string
          currency?: string
          discount_paise?: number
          discount_snapshot?: Json | null
          fulfilment_status?: string
          id?: string
          order_number?: string
          payment_status?: string
          shipping_address_snapshot?: Json
          shipping_paise?: number
          subtotal_paise?: number
          total_paise?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          created_at: string
          currency: string
          expected_amount_paise: number
          failure_code: string | null
          failure_description: string | null
          id: string
          order_id: string
          provider_status: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          expected_amount_paise: number
          failure_code?: string | null
          failure_description?: string | null
          id?: string
          order_id: string
          provider_status?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          expected_amount_paise?: number
          failure_code?: string | null
          failure_description?: string | null
          id?: string
          order_id?: string
          provider_status?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          colour: string
          compare_at_price_paise: number | null
          created_at: string
          id: string
          is_discontinued: boolean
          price_paise: number
          product_id: string
          size: string
          sku: string
          updated_at: string
        }
        Insert: {
          colour: string
          compare_at_price_paise?: number | null
          created_at?: string
          id?: string
          is_discontinued?: boolean
          price_paise: number
          product_id: string
          size: string
          sku: string
          updated_at?: string
        }
        Update: {
          colour?: string
          compare_at_price_paise?: number | null
          created_at?: string
          id?: string
          is_discontinued?: boolean
          price_paise?: number
          product_id?: string
          size?: string
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          category_id: string
          created_at: string
          description: string | null
          design_code: string
          id: string
          is_bestseller: boolean
          is_new: boolean
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          care_instructions?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          design_code: string
          id?: string
          is_bestseller?: boolean
          is_new?: boolean
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          care_instructions?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          design_code?: string
          id?: string
          is_bestseller?: boolean
          is_new?: boolean
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          admin_actor_id: string | null
          amount_paise: number
          created_at: string
          id: string
          idempotency_key: string
          order_id: string
          payment_attempt_id: string
          razorpay_refund_id: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_actor_id?: string | null
          amount_paise: number
          created_at?: string
          id?: string
          idempotency_key: string
          order_id: string
          payment_attempt_id: string
          razorpay_refund_id?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_actor_id?: string | null
          amount_paise?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          order_id?: string
          payment_attempt_id?: string
          razorpay_refund_id?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_attempt_id_fkey"
            columns: ["payment_attempt_id"]
            isOneToOne: false
            referencedRelation: "payment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          courier_name: string
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          shipped_at: string | null
          tracking_reference: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          courier_name: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          shipped_at?: string | null
          tracking_reference: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          courier_name?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          shipped_at?: string | null
          tracking_reference?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          attempts: number
          error_summary: string | null
          event_type: string
          id: string
          processed_at: string | null
          processing_status: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          attempts?: number
          error_summary?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          processing_status?: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          attempts?: number
          error_summary?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          processing_status?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory: {
        Args: {
          p_order_id?: string
          p_quantity_change: number
          p_reason: string
          p_variant_id: string
        }
        Returns: number
      }
      assert_service_or_admin: { Args: never; Returns: undefined }
      finalize_captured_payment: {
        Args: {
          p_captured_amount_paise: number
          p_currency?: string
          p_payment_attempt_id: string
          p_razorpay_payment_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      merge_guest_cart: {
        Args: { p_guest_cart_id: string; p_user_id: string }
        Returns: string
      }
      release_expired_inventory_reservations: { Args: never; Returns: number }
      reserve_inventory: {
        Args: { p_expires_at?: string; p_items: Json; p_order_id: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
