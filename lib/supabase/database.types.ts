/**
 * Supabase Database type.
 *
 * The precise generated types live behind `npm run gen:types` (wired in
 * package.json) which writes the full schema here from the live project. For
 * day-to-day development this permissive shape lets the typed client accept
 * every table/view/RPC; precise, hand-maintained row types for the surfaces we
 * build against are in `lib/supabase/rows.ts`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GenericTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

type GenericFunction = {
  Args: Record<string, any>;
  Returns: any;
};

export interface Database {
  public: {
    Tables: { [name: string]: GenericTable };
    Views: { [name: string]: GenericTable };
    Functions: { [name: string]: GenericFunction };
    Enums: { [name: string]: string };
    CompositeTypes: Record<string, never>;
  };
}
