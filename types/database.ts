export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      people: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          normalized_name: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "people_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          id: string;
          username: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          id: string;
          username: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          username?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          created_at: string;
          id: string;
          person_id: string;
          stars: number;
          text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          person_id: string;
          stars: number;
          text: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          person_id?: string;
          stars?: number;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
