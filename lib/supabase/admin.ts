import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the SERVICE ROLE key.
 *
 * `import "server-only"` makes it a build error to import this module
 * from any client component or code that could end up in the browser
 * bundle. This client BYPASSES Row Level Security — use it only for
 * trusted server-side operations that have already authorized the
 * request themselves (e.g. admin actions, webhooks, scheduled jobs).
 *
 * Never:
 *  - import this from a "use client" file
 *  - forward its result set directly to the client without re-checking
 *    what the requesting user is actually allowed to see
 *  - use it as a shortcut to "skip" RLS policy design
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set on the server.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
