/**
 * Placeholder for Supabase's generated database types.
 *
 * Once migrations exist (Phase 2), replace this file's contents with the
 * real output of:
 *
 *   supabase gen types typescript --project-id <project-id> > types/database.ts
 *
 * Until then this loose shape lets `createClient<Database>()` type-check
 * without pretending we know the real schema. Do not hand-author table
 * types here — that invites drift from the actual database.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
