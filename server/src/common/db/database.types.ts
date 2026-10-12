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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          name_ar: string | null
          name_en: string | null
          notifications_seen_at: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id: string
          name_ar?: string | null
          name_en?: string | null
          notifications_seen_at?: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string | null
          name_en?: string | null
          notifications_seen_at?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      admin_log: {
        Row: {
          action: Database["public"]["Enums"]["admin_action"]
          admin_id: string
          at: string
          detail: string | null
          id: string
          note: string | null
          target_id: string
          target_kind: string
        }
        Insert: {
          action: Database["public"]["Enums"]["admin_action"]
          admin_id: string
          at?: string
          detail?: string | null
          id?: string
          note?: string | null
          target_id: string
          target_kind: string
        }
        Update: {
          action?: Database["public"]["Enums"]["admin_action"]
          admin_id?: string
          at?: string
          detail?: string | null
          id?: string
          note?: string | null
          target_id?: string
          target_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string
          created_at: string
          holder_name: string
          iban: string
          id: string
          replaced_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          holder_name: string
          iban: string
          id?: string
          replaced_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          holder_name?: string
          iban?: string
          id?: string
          replaced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transfers: {
        Row: {
          account_id: string
          amount: number
          bank_ref: string | null
          handled_by: string | null
          holder_name: string | null
          iban: string | null
          id: string
          kind: Database["public"]["Enums"]["transfer_kind"]
          reject_note: string | null
          requested_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["transfer_status"]
        }
        Insert: {
          account_id: string
          amount: number
          bank_ref?: string | null
          handled_by?: string | null
          holder_name?: string | null
          iban?: string | null
          id?: string
          kind: Database["public"]["Enums"]["transfer_kind"]
          reject_note?: string | null
          requested_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
        }
        Update: {
          account_id?: string
          amount?: number
          bank_ref?: string | null
          handled_by?: string | null
          holder_name?: string | null
          iban?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["transfer_kind"]
          reject_note?: string | null
          requested_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_registrations: {
        Row: {
          brand_id: string
          cr_number: string | null
          updated_at: string
          vat_certificate_path: string | null
        }
        Insert: {
          brand_id: string
          cr_number?: string | null
          updated_at?: string
          vat_certificate_path?: string | null
        }
        Update: {
          brand_id?: string
          cr_number?: string | null
          updated_at?: string
          vat_certificate_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_registrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          about: string | null
          account_id: string
          created_at: string
          id: string
          industry: Database["public"]["Enums"]["industry"]
          instagram: string | null
          logo_path: string | null
          name_ar: string | null
          name_en: string | null
          tiktok: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          about?: string | null
          account_id: string
          created_at?: string
          id?: string
          industry: Database["public"]["Enums"]["industry"]
          instagram?: string | null
          logo_path?: string | null
          name_ar?: string | null
          name_en?: string | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          account_id?: string
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["industry"]
          instagram?: string | null
          logo_path?: string | null
          name_ar?: string | null
          name_en?: string | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_secrets: {
        Row: {
          access_link: string | null
          campaign_id: string
          code: string | null
          login_details: string | null
        }
        Insert: {
          access_link?: string | null
          campaign_id: string
          code?: string | null
          login_details?: string | null
        }
        Update: {
          access_link?: string | null
          campaign_id?: string
          code?: string | null
          login_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_secrets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          avoid: string | null
          brand_id: string
          brief: string | null
          cancelled_at: string | null
          copied_from: string | null
          created_at: string
          deadline: string | null
          draft: Json | null
          events: Json
          id: string
          key_message: string | null
          launched_at: string | null
          logistics: Json
          must_include: string | null
          product_id: string | null
          reference_links: string[]
          status: Database["public"]["Enums"]["campaign_status"]
          title: string | null
          updated_at: string
          video_style: Database["public"]["Enums"]["video_style"] | null
        }
        Insert: {
          avoid?: string | null
          brand_id: string
          brief?: string | null
          cancelled_at?: string | null
          copied_from?: string | null
          created_at?: string
          deadline?: string | null
          draft?: Json | null
          events?: Json
          id?: string
          key_message?: string | null
          launched_at?: string | null
          logistics?: Json
          must_include?: string | null
          product_id?: string | null
          reference_links?: string[]
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string | null
          updated_at?: string
          video_style?: Database["public"]["Enums"]["video_style"] | null
        }
        Update: {
          avoid?: string | null
          brand_id?: string
          brief?: string | null
          cancelled_at?: string | null
          copied_from?: string | null
          created_at?: string
          deadline?: string | null
          draft?: Json | null
          events?: Json
          id?: string
          key_message?: string | null
          launched_at?: string | null
          logistics?: Json
          must_include?: string | null
          product_id?: string | null
          reference_links?: string[]
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string | null
          updated_at?: string
          video_style?: Database["public"]["Enums"]["video_style"] | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_copied_from_fkey"
            columns: ["copied_from"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_product_id_brand_id_fkey"
            columns: ["product_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "brand_id"]
          },
        ]
      }
      cart_items: {
        Row: {
          account_id: string
          added_at: string
          creator_id: string
          format: Database["public"]["Enums"]["content_format"]
          id: string
          quantity: number
        }
        Insert: {
          account_id: string
          added_at?: string
          creator_id: string
          format: Database["public"]["Enums"]["content_format"]
          id?: string
          quantity?: number
        }
        Update: {
          account_id?: string
          added_at?: string
          creator_id?: string
          format?: Database["public"]["Enums"]["content_format"]
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          brand_id: string | null
          brand_read_at: string | null
          created_at: string
          creator_id: string
          creator_read_at: string | null
          id: string
          order_id: string | null
        }
        Insert: {
          brand_id?: string | null
          brand_read_at?: string | null
          created_at?: string
          creator_id: string
          creator_read_at?: string | null
          id?: string
          order_id?: string | null
        }
        Update: {
          brand_id?: string | null
          brand_read_at?: string | null
          created_at?: string
          creator_id?: string
          creator_read_at?: string | null
          id?: string
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
        ]
      }
      creator_addresses: {
        Row: {
          address_text: string
          created_at: string
          creator_id: string
          id: string
          label: string | null
          latitude: number | null
          longitude: number | null
          type: Database["public"]["Enums"]["address_type"]
        }
        Insert: {
          address_text: string
          created_at?: string
          creator_id: string
          id?: string
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          type: Database["public"]["Enums"]["address_type"]
        }
        Update: {
          address_text?: string
          created_at?: string
          creator_id?: string
          id?: string
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: Database["public"]["Enums"]["address_type"]
        }
        Relationships: [
          {
            foreignKeyName: "creator_addresses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_addresses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_approvals: {
        Row: {
          creator_id: string
          decided_at: string | null
          decided_by: string | null
          decision: Database["public"]["Enums"]["creator_status"] | null
          id: string
          intro_video_path: string
          note: string | null
          sample_paths: string[]
          submitted_at: string
        }
        Insert: {
          creator_id: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["creator_status"] | null
          id?: string
          intro_video_path: string
          note?: string | null
          sample_paths: string[]
          submitted_at?: string
        }
        Update: {
          creator_id?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["creator_status"] | null
          id?: string
          intro_video_path?: string
          note?: string | null
          sample_paths?: string[]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_approvals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_approvals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_approvals_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_formats: {
        Row: {
          creator_id: string
          format: Database["public"]["Enums"]["content_format"]
          price: number
        }
        Insert: {
          creator_id: string
          format: Database["public"]["Enums"]["content_format"]
          price: number
        }
        Update: {
          creator_id?: string
          format?: Database["public"]["Enums"]["content_format"]
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_formats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_formats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_list_items: {
        Row: {
          added_at: string
          creator_id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          creator_id: string
          list_id: string
        }
        Update: {
          added_at?: string
          creator_id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_list_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_list_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_lists: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_favorites: boolean
          name: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_favorites?: boolean
          name?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_favorites?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_lists_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_portfolio: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          video_path: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          video_path: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          video_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_portfolio_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_portfolio_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_socials: {
        Row: {
          creator_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          username: string
        }
        Insert: {
          creator_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          username: string
        }
        Update: {
          creator_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_socials_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_socials_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          approved_at: string | null
          bio: string | null
          city: string | null
          completed_orders: number
          country: string
          created_at: string
          gender: Database["public"]["Enums"]["gender"] | null
          handle: string
          id: string
          name_ar: string | null
          name_en: string | null
          niches: Database["public"]["Enums"]["niche"][]
          photo_path: string | null
          shows_face: boolean | null
          status: Database["public"]["Enums"]["creator_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          bio?: string | null
          city?: string | null
          completed_orders?: number
          country?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          handle: string
          id: string
          name_ar?: string | null
          name_en?: string | null
          niches?: Database["public"]["Enums"]["niche"][]
          photo_path?: string | null
          shows_face?: boolean | null
          status?: Database["public"]["Enums"]["creator_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          bio?: string | null
          city?: string | null
          completed_orders?: number
          country?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          handle?: string
          id?: string
          name_ar?: string | null
          name_en?: string | null
          niches?: Database["public"]["Enums"]["niche"][]
          photo_path?: string | null
          shows_face?: boolean | null
          status?: Database["public"]["Enums"]["creator_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          note: string | null
          order_id: string | null
          payment_id: string | null
          transfer_id: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          transfer_id?: string | null
          type: Database["public"]["Enums"]["ledger_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          transfer_id?: string | null
          type?: Database["public"]["Enums"]["ledger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "bank_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: Database["public"]["Enums"]["actor"]
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: Database["public"]["Enums"]["actor"]
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: Database["public"]["Enums"]["actor"]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_clips: {
        Row: {
          duration_sec: number | null
          id: string
          note: string | null
          order_id: string
          size_bytes: number | null
          uploaded_at: string
          version: number
          video_path: string
        }
        Insert: {
          duration_sec?: number | null
          id?: string
          note?: string | null
          order_id: string
          size_bytes?: number | null
          uploaded_at?: string
          version: number
          video_path: string
        }
        Update: {
          duration_sec?: number | null
          id?: string
          note?: string | null
          order_id?: string
          size_bytes?: number | null
          uploaded_at?: string
          version?: number
          video_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_clips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_clips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_clips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor: Database["public"]["Enums"]["actor"]
          actor_id: string | null
          at: string
          data: Json
          id: string
          order_id: string
          type: Database["public"]["Enums"]["order_event_type"]
        }
        Insert: {
          actor: Database["public"]["Enums"]["actor"]
          actor_id?: string | null
          at?: string
          data?: Json
          id?: string
          order_id: string
          type: Database["public"]["Enums"]["order_event_type"]
        }
        Update: {
          actor?: Database["public"]["Enums"]["actor"]
          actor_id?: string | null
          at?: string
          data?: Json
          id?: string
          order_id?: string
          type?: Database["public"]["Enums"]["order_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_fees: {
        Row: {
          fee: number
          order_id: string
        }
        Insert: {
          fee: number
          order_id: string
        }
        Update: {
          fee?: number
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          ad_code: string | null
          ad_code_expires_at: string | null
          amount: number
          approved_at: string | null
          approved_by: Database["public"]["Enums"]["actor"] | null
          brand_id: string
          campaign_id: string
          cancelled_at: string | null
          cancelled_by: Database["public"]["Enums"]["actor"] | null
          clip_public: boolean
          created_at: string
          creator_id: string
          creator_seen_approval_at: string | null
          deadline: string | null
          decline_note: string | null
          decline_reason: Database["public"]["Enums"]["decline_reason"] | null
          declined_at: string | null
          delivered_at: string | null
          format: Database["public"]["Enums"]["content_format"]
          id: string
          note: string | null
          number: number
          payment_id: string | null
          rated_at: string | null
          rating: number | null
          received_at: string | null
          returned_at: string | null
          review: string | null
          revision_note: string | null
          revision_requested_at: string | null
          sent_at: string | null
          ship_note: string | null
          ship_to: Json | null
          status: Database["public"]["Enums"]["order_status"]
          terms_version: string | null
          updated_at: string
          views: number | null
          views_updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          ad_code?: string | null
          ad_code_expires_at?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: Database["public"]["Enums"]["actor"] | null
          brand_id: string
          campaign_id: string
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["actor"] | null
          clip_public?: boolean
          created_at?: string
          creator_id: string
          creator_seen_approval_at?: string | null
          deadline?: string | null
          decline_note?: string | null
          decline_reason?: Database["public"]["Enums"]["decline_reason"] | null
          declined_at?: string | null
          delivered_at?: string | null
          format: Database["public"]["Enums"]["content_format"]
          id?: string
          note?: string | null
          number?: never
          payment_id?: string | null
          rated_at?: string | null
          rating?: number | null
          received_at?: string | null
          returned_at?: string | null
          review?: string | null
          revision_note?: string | null
          revision_requested_at?: string | null
          sent_at?: string | null
          ship_note?: string | null
          ship_to?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          terms_version?: string | null
          updated_at?: string
          views?: number | null
          views_updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          ad_code?: string | null
          ad_code_expires_at?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: Database["public"]["Enums"]["actor"] | null
          brand_id?: string
          campaign_id?: string
          cancelled_at?: string | null
          cancelled_by?: Database["public"]["Enums"]["actor"] | null
          clip_public?: boolean
          created_at?: string
          creator_id?: string
          creator_seen_approval_at?: string | null
          deadline?: string | null
          decline_note?: string | null
          decline_reason?: Database["public"]["Enums"]["decline_reason"] | null
          declined_at?: string | null
          delivered_at?: string | null
          format?: Database["public"]["Enums"]["content_format"]
          id?: string
          note?: string | null
          number?: never
          payment_id?: string | null
          rated_at?: string | null
          rating?: number | null
          received_at?: string | null
          returned_at?: string | null
          review?: string | null
          revision_note?: string | null
          revision_requested_at?: string | null
          sent_at?: string | null
          ship_note?: string | null
          ship_to?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          terms_version?: string | null
          updated_at?: string
          views?: number | null
          views_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_id: string
          by_card: number
          campaign_id: string | null
          created_at: string
          from_balance: number
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          paid_at: string | null
          picks: Json | null
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          total: number
        }
        Insert: {
          account_id: string
          by_card?: number
          campaign_id?: string | null
          created_at?: string
          from_balance?: number
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          paid_at?: string | null
          picks?: Json | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total: number
        }
        Update: {
          account_id?: string
          by_card?: number
          campaign_id?: string | null
          created_at?: string
          from_balance?: number
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          paid_at?: string | null
          picks?: Json | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_orders: {
        Row: {
          order_id: string
          transfer_id: string
        }
        Insert: {
          order_id: string
          transfer_id: string
        }
        Update: {
          order_id?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payout_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payout_orders_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "bank_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          benefits: string[]
          brand_id: string
          concerns: Json
          created_at: string
          description: string | null
          details: Json
          id: string
          name: string
          photos: string[]
          price: number | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
        }
        Insert: {
          benefits?: string[]
          brand_id: string
          concerns?: Json
          created_at?: string
          description?: string | null
          details?: Json
          id?: string
          name: string
          photos?: string[]
          price?: number | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Update: {
          benefits?: string[]
          brand_id?: string
          concerns?: Json
          created_at?: string
          description?: string | null
          details?: Json
          id?: string
          name?: string
          photos?: string[]
          price?: number | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          conversation_id: string | null
          created_at: string
          details: string | null
          id: string
          order_id: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by: string
          reporter: Database["public"]["Enums"]["actor"]
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by: string
          reporter: Database["public"]["Enums"]["actor"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          order_id?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_by?: string
          reporter?: Database["public"]["Enums"]["actor"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "creator_reviews"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "public_clips"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      suspensions: {
        Row: {
          account_id: string
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          suspended_at: string
          suspended_by: string
        }
        Insert: {
          account_id: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          suspended_at?: string
          suspended_by: string
        }
        Update: {
          account_id?: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          suspended_at?: string
          suspended_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspensions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_lifted_by_fkey"
            columns: ["lifted_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_requests: {
        Row: {
          country: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          country: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      balances: {
        Row: {
          account_id: string | null
          balance: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookable_creators: {
        Row: {
          approved_at: string | null
          bio: string | null
          city: string | null
          completed_orders: number | null
          country: string | null
          created_at: string | null
          from_price: number | null
          gender: Database["public"]["Enums"]["gender"] | null
          handle: string | null
          id: string | null
          name_ar: string | null
          name_en: string | null
          niches: Database["public"]["Enums"]["niche"][] | null
          photo_path: string | null
          rating: number | null
          review_count: number | null
          shows_face: boolean | null
          status: Database["public"]["Enums"]["creator_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_ratings: {
        Row: {
          creator_id: string | null
          rating: number | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_reviews: {
        Row: {
          brand_name_ar: string | null
          brand_name_en: string | null
          creator_id: string | null
          order_id: string | null
          rated_at: string | null
          rating: number | null
          review: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      public_clips: {
        Row: {
          approved_at: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          creator_id: string | null
          duration_sec: number | null
          order_id: string | null
          video_path: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "bookable_creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_offer: {
        Args: { address_id?: string; order_id: string; terms_version?: string }
        Returns: undefined
      }
      admin_cancel_order: {
        Args: { note: string; order_id: string }
        Returns: undefined
      }
      admin_set_deadline: {
        Args: { deadline: string; note?: string; order_id: string }
        Returns: undefined
      }
      approve_order: {
        Args: {
          clip_public?: boolean
          comment?: string
          order_id: string
          rating?: number
        }
        Returns: undefined
      }
      auto_approve_orders: { Args: never; Returns: number }
      checkout: {
        Args: { campaign_id: string; picks: Json; use_balance?: boolean }
        Returns: string
      }
      confirm_payment: {
        Args: { payment_id: string; provider: string; provider_ref: string }
        Returns: undefined
      }
      confirm_received: { Args: { order_id: string }; Returns: undefined }
      decide_creator: {
        Args: {
          creator_id: string
          decision: Database["public"]["Enums"]["creator_status"]
          note?: string
        }
        Returns: undefined
      }
      decline_offer: {
        Args: {
          note?: string
          order_id: string
          reason?: Database["public"]["Enums"]["decline_reason"]
        }
        Returns: undefined
      }
      edit_campaign_details: {
        Args: {
          avoid: string
          campaign_id: string
          key_message: string
          must_include: string
          reference_links: string[]
        }
        Returns: undefined
      }
      expire_offers: { Args: never; Returns: number }
      extend_deadline: {
        Args: { campaign_id: string; deadline: string }
        Returns: undefined
      }
      fail_payment: {
        Args: { payment_id: string; provider: string; provider_ref: string }
        Returns: undefined
      }
      has_name: { Args: { ar: string; en: string }; Returns: boolean }
      join_waitlist: {
        Args: { contact: string; country: string }
        Returns: undefined
      }
      mark_approval_seen: { Args: { order_id: string }; Returns: undefined }
      mark_deadlines_passed: { Args: never; Returns: number }
      mark_payout_paid: {
        Args: { bank_ref: string; creator_id: string; order_ids: string[] }
        Returns: string
      }
      mark_returned: { Args: { order_id: string }; Returns: undefined }
      mark_sent: {
        Args: { note?: string; order_id: string }
        Returns: undefined
      }
      rate_order: {
        Args: { order_id: string; rating: number }
        Returns: undefined
      }
      reject_withdrawal: {
        Args: { note: string; withdrawal_id: string }
        Returns: undefined
      }
      remove_bank_account: { Args: never; Returns: undefined }
      request_revision: {
        Args: { note: string; order_id: string }
        Returns: undefined
      }
      request_withdrawal: { Args: { amount: number }; Returns: string }
      resolve_report: {
        Args: { report_id: string; resolution: string }
        Returns: undefined
      }
      send_withdrawal: {
        Args: { bank_ref: string; withdrawal_id: string }
        Returns: undefined
      }
      set_ad_code: {
        Args: { code: string; order_id: string; valid_days: number }
        Returns: undefined
      }
      set_bank_account: {
        Args: { holder_name: string; iban: string }
        Returns: undefined
      }
      set_clip_public: {
        Args: { order_id: string; visible: boolean }
        Returns: undefined
      }
      start_top_up: { Args: { amount: number }; Returns: string }
      submit_application: {
        Args: { intro_video_path?: string }
        Returns: undefined
      }
      submit_clip: {
        Args: {
          ad_code?: string
          ad_code_days?: number
          duration_sec?: number
          note?: string
          order_id: string
          size_bytes?: number
          video_path: string
        }
        Returns: undefined
      }
      suspend: {
        Args: { kind: string; reason: string; target_id: string }
        Returns: undefined
      }
      unsuspend: {
        Args: { kind: string; target_id: string }
        Returns: undefined
      }
      withdraw_offer: { Args: { order_id: string }; Returns: undefined }
    }
    Enums: {
      actor: "creator" | "brand" | "admin" | "system"
      address_type: "home" | "work"
      admin_action:
        | "creator_approved"
        | "changes_requested"
        | "creator_rejected"
        | "suspended"
        | "unsuspended"
        | "login_reset"
        | "deadline_extended"
        | "order_cancelled"
        | "payout_sent"
        | "withdrawal_sent"
        | "withdrawal_rejected"
        | "report_resolved"
      campaign_status: "draft" | "live" | "cancelled"
      content_format: "tiktok_video" | "instagram_reel" | "instagram_story"
      creator_status:
        | "incomplete"
        | "pending"
        | "changes_requested"
        | "rejected"
        | "approved"
      decline_reason: "busy" | "not_my_niche" | "other" | "expired"
      gender: "female" | "male"
      industry:
        | "food_beverage"
        | "fashion"
        | "tech"
        | "real_estate"
        | "automotive"
        | "health"
        | "education"
        | "home_living"
        | "other"
      ledger_type:
        | "top_up"
        | "card_payment"
        | "charge"
        | "refund"
        | "earning"
        | "payout"
        | "withdrawal"
        | "withdrawal_returned"
        | "adjustment"
      niche:
        | "general"
        | "beauty"
        | "food"
        | "fashion"
        | "family"
        | "fitness"
        | "travel"
        | "tech"
        | "gaming"
      order_event_type:
        | "offered"
        | "accepted"
        | "declined"
        | "expired"
        | "cancelled"
        | "sent"
        | "received"
        | "uploaded"
        | "revision_requested"
        | "approved"
        | "returned"
        | "ad_code_added"
        | "deadline_moved"
        | "deadline_passed"
      order_status:
        | "pending"
        | "in_progress"
        | "delivered"
        | "approved"
        | "declined"
        | "cancelled"
      payment_kind: "checkout" | "top_up"
      payment_status: "pending" | "paid" | "failed"
      product_type: "physical" | "app" | "service" | "venue"
      report_reason:
        | "off_platform"
        | "abuse"
        | "spam"
        | "not_delivered"
        | "not_as_agreed"
        | "product_issue"
        | "creator_conduct"
        | "brand_conduct"
        | "payment"
        | "other"
      report_status: "open" | "resolved"
      social_platform: "instagram" | "tiktok"
      transfer_kind: "withdrawal" | "payout"
      transfer_status: "requested" | "sent" | "rejected"
      user_role: "creator" | "brand" | "admin"
      video_style: "ad" | "review" | "routine" | "unboxing" | "howto" | "other"
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
      actor: ["creator", "brand", "admin", "system"],
      address_type: ["home", "work"],
      admin_action: [
        "creator_approved",
        "changes_requested",
        "creator_rejected",
        "suspended",
        "unsuspended",
        "login_reset",
        "deadline_extended",
        "order_cancelled",
        "payout_sent",
        "withdrawal_sent",
        "withdrawal_rejected",
        "report_resolved",
      ],
      campaign_status: ["draft", "live", "cancelled"],
      content_format: ["tiktok_video", "instagram_reel", "instagram_story"],
      creator_status: [
        "incomplete",
        "pending",
        "changes_requested",
        "rejected",
        "approved",
      ],
      decline_reason: ["busy", "not_my_niche", "other", "expired"],
      gender: ["female", "male"],
      industry: [
        "food_beverage",
        "fashion",
        "tech",
        "real_estate",
        "automotive",
        "health",
        "education",
        "home_living",
        "other",
      ],
      ledger_type: [
        "top_up",
        "card_payment",
        "charge",
        "refund",
        "earning",
        "payout",
        "withdrawal",
        "withdrawal_returned",
        "adjustment",
      ],
      niche: [
        "general",
        "beauty",
        "food",
        "fashion",
        "family",
        "fitness",
        "travel",
        "tech",
        "gaming",
      ],
      order_event_type: [
        "offered",
        "accepted",
        "declined",
        "expired",
        "cancelled",
        "sent",
        "received",
        "uploaded",
        "revision_requested",
        "approved",
        "returned",
        "ad_code_added",
        "deadline_moved",
        "deadline_passed",
      ],
      order_status: [
        "pending",
        "in_progress",
        "delivered",
        "approved",
        "declined",
        "cancelled",
      ],
      payment_kind: ["checkout", "top_up"],
      payment_status: ["pending", "paid", "failed"],
      product_type: ["physical", "app", "service", "venue"],
      report_reason: [
        "off_platform",
        "abuse",
        "spam",
        "not_delivered",
        "not_as_agreed",
        "product_issue",
        "creator_conduct",
        "brand_conduct",
        "payment",
        "other",
      ],
      report_status: ["open", "resolved"],
      social_platform: ["instagram", "tiktok"],
      transfer_kind: ["withdrawal", "payout"],
      transfer_status: ["requested", "sent", "rejected"],
      user_role: ["creator", "brand", "admin"],
      video_style: ["ad", "review", "routine", "unboxing", "howto", "other"],
    },
  },
} as const
