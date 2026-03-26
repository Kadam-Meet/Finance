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
      ai_logs: {
        Row: {
          created_at: string
          feature: string
          id: string
          input_data: Json | null
          model_used: string | null
          output_data: Json | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bill_reminders: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          due_date: string
          id: string
          is_paid: boolean | null
          is_recurring: boolean | null
          name: string
          notify_days_before: number | null
          recurrence: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          name: string
          notify_days_before?: number | null
          recurrence?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean | null
          is_recurring?: boolean | null
          name?: string
          notify_days_before?: number | null
          recurrence?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_forecasts: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          lower_bound: number | null
          month: number
          predicted_amount: number
          upper_bound: number | null
          user_id: string
          year: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          lower_bound?: number | null
          month: number
          predicted_amount: number
          upper_bound?: number | null
          user_id: string
          year: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          lower_bound?: number | null
          month?: number
          predicted_amount?: number
          upper_bound?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          ai_categorized: boolean | null
          ai_confidence: number | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          receipt_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_categorized?: boolean | null
          ai_confidence?: number | null
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_categorized?: boolean | null
          ai_confidence?: number | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_expense_splits: {
        Row: {
          amount: number
          expense_id: string
          id: string
          is_paid: boolean | null
          paid_at: string | null
          percentage: number | null
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "group_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      group_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          group_id: string
          id: string
          paid_by: string
          receipt_url: string | null
          split_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description: string
          group_id: string
          id?: string
          paid_by: string
          receipt_url?: string | null
          split_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          group_id?: string
          id?: string
          paid_by?: string
          receipt_url?: string | null
          split_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          balance: number | null
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_ai_insights: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          insight_text: string
          insight_type: string
          investment_id: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          insight_text: string
          insight_type: string
          investment_id: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          insight_text?: string
          insight_type?: string
          investment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_ai_insights_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_analysis: {
        Row: {
          calculated_at: string
          current_value: number
          id: string
          investment_id: string
          net_profit: number
          profit: number
          return_percentage: number
          tax_amount: number
          tax_type: string
          total_investment: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          current_value: number
          id?: string
          investment_id: string
          net_profit: number
          profit: number
          return_percentage: number
          tax_amount: number
          tax_type: string
          total_investment: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          current_value?: number
          id?: string
          investment_id?: string
          net_profit?: number
          profit?: number
          return_percentage?: number
          tax_amount?: number
          tax_type?: string
          total_investment?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_analysis_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          buy_date: string
          buy_price: number
          created_at: string
          id: string
          quantity: number
          sell_date: string | null
          sell_price: number | null
          status: string | null
          stock_name: string
          tax_slab: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_date: string
          buy_price: number
          created_at?: string
          id?: string
          quantity: number
          sell_date?: string | null
          sell_price?: number | null
          status?: string | null
          stock_name: string
          tax_slab: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_date?: string
          buy_price?: number
          created_at?: string
          id?: string
          quantity?: number
          sell_date?: string | null
          sell_price?: number | null
          status?: string | null
          stock_name?: string
          tax_slab?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          is_read: boolean | null
          message: string
          reminder_id: string | null
          sent_at: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          message: string
          reminder_id?: string | null
          sent_at?: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          is_read?: boolean | null
          message?: string
          reminder_id?: string | null
          sent_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "bill_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_uploads: {
        Row: {
          ai_parsed_data: Json | null
          confidence: number | null
          created_at: string
          expense_id: string | null
          extracted_text: string | null
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          ai_parsed_data?: Json | null
          confidence?: number | null
          created_at?: string
          expense_id?: string | null
          extracted_text?: string | null
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          ai_parsed_data?: Json | null
          confidence?: number | null
          created_at?: string
          expense_id?: string | null
          extracted_text?: string | null
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_uploads_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          ai_confidence: number | null
          ai_detected_category: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          extracted_text: string | null
          id: string
          image_url: string | null
          is_reimbursable: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_detected_category?: string | null
          amount: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          is_reimbursable?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_detected_category?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          is_reimbursable?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          default_currency: string | null
          email_notifications: boolean | null
          fiscal_year_start: number | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_currency?: string | null
          email_notifications?: boolean | null
          fiscal_year_start?: number | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_currency?: string | null
          email_notifications?: boolean | null
          fiscal_year_start?: number | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
