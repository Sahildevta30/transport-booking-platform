import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Browser-safe Supabase client.
 *
 * Only ever uses NEXT_PUBLIC_* env vars (anon key + URL). This client is
 * subject to Row Level Security — it must NEVER be given the service-role
 * key. For privileged, server-only operations use `lib/supabase/admin.ts`
 * instead, and only from server-side code (Server Actions, Route Handlers).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
