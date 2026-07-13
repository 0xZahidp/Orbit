export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string;
          group_id: string | null;
          id: string;
          text: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          group_id?: string | null;
          id?: string;
          text: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          group_id?: string | null;
          id?: string;
          text?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          monthly_share: number;
          months_paid: number;
          orbit_points: number;
          role: Database["public"]["Enums"]["group_role"];
          status: Database["public"]["Enums"]["member_status"];
          streak: number;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          monthly_share?: number;
          months_paid?: number;
          orbit_points?: number;
          role?: Database["public"]["Enums"]["group_role"];
          status?: Database["public"]["Enums"]["member_status"];
          streak?: number;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          monthly_share?: number;
          months_paid?: number;
          orbit_points?: number;
          role?: Database["public"]["Enums"]["group_role"];
          status?: Database["public"]["Enums"]["member_status"];
          streak?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          bkash: string | null;
          category: string;
          created_at: string;
          currency: string;
          due_date: string | null;
          gradient: string;
          icon: string;
          id: string;
          invite_code: string;
          max_seats: number;
          monthly_total: number;
          nagad: string | null;
          name: string;
          owner_id: string;
          payment_instructions: string | null;
          renewal_date: string | null;
          split_method: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          bkash?: string | null;
          category?: string;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          gradient?: string;
          icon?: string;
          id?: string;
          invite_code?: string;
          max_seats?: number;
          monthly_total?: number;
          nagad?: string | null;
          name: string;
          owner_id: string;
          payment_instructions?: string | null;
          renewal_date?: string | null;
          split_method?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          bkash?: string | null;
          category?: string;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          gradient?: string;
          icon?: string;
          id?: string;
          invite_code?: string;
          max_seats?: number;
          monthly_total?: number;
          nagad?: string | null;
          name?: string;
          owner_id?: string;
          payment_instructions?: string | null;
          renewal_date?: string | null;
          split_method?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          group_id: string | null;
          id: string;
          kind: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          kind?: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          group_id?: string | null;
          id?: string;
          kind?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          cycle_month: string;
          group_id: string;
          id: string;
          method: string | null;
          note: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          submitted_at: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number;
          cycle_month: string;
          group_id: string;
          id?: string;
          method?: string | null;
          note?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          cycle_month?: string;
          group_id?: string;
          id?: string;
          method?: string | null;
          note?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_gradient: string;
          bank: string | null;
          bkash: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          id: string;
          nagad: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_gradient?: string;
          bank?: string | null;
          bkash?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          id: string;
          nagad?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_gradient?: string;
          bank?: string | null;
          bkash?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          id?: string;
          nagad?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gen_invite_code: { Args: never; Returns: string };
      group_preview_by_code: {
        Args: { _code: string };
        Returns: {
          category: string;
          currency: string;
          gradient: string;
          icon: string;
          id: string;
          max_seats: number;
          member_count: number;
          monthly_total: number;
          name: string;
        }[];
      };
      is_group_manager: {
        Args: { _group: string; _user: string };
        Returns: boolean;
      };
      is_group_member: {
        Args: { _group: string; _user: string };
        Returns: boolean;
      };
      join_group_by_code: { Args: { _code: string }; Returns: string };
      shares_group: { Args: { _other: string }; Returns: boolean };
    };
    Enums: {
      group_role: "owner" | "co_manager" | "member";
      member_status: "pending" | "active" | "removed" | "left";
      payment_status: "submitted" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      group_role: ["owner", "co_manager", "member"],
      member_status: ["pending", "active", "removed", "left"],
      payment_status: ["submitted", "approved", "rejected"],
    },
  },
} as const;
