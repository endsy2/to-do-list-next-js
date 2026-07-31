export type Database = {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string;
          todo: string;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          todo: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          todo?: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type TodoRow = Database["public"]["Tables"]["todos"]["Row"];
