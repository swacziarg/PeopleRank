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
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          normalized_name: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
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
          display_name: string | null;
          id: string;
          avatar_url: string | null;
          username: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          avatar_url?: string | null;
          username: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          avatar_url?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      rating_likes: {
        Row: {
          created_at: string | null;
          rating_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          rating_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          rating_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rating_likes_rating_id_fkey";
            columns: ["rating_id"];
            referencedRelation: "ratings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rating_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
    Functions: {
      get_ranked_people_page: {
        Args: {
          page_number?: number;
          page_size?: number;
          search_term?: string | null;
          sort_by?: string;
        };
        Returns: {
          average_stars: number;
          comment_count: number;
          created_at: string;
          engagement_score: number;
          id: string;
          image_url: string | null;
          lowest_stars: number | null;
          name: string;
          rank: number;
          rating_count: number;
          total_count: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
