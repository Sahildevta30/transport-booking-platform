import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the request's auth cookies so the
 * user's session (and therefore Row Level Security context) travels with
 * every query. Still uses only the anon key — this is NOT the privileged
 * client. For service-role operations see `lib/supabase/admin.ts`.
 *
 * Server Components can't set cookies, so writes are wrapped in a
 * try/catch — session refresh in that case is handled by middleware
 * instead (see middleware.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — session refresh is
            // handled by middleware.ts instead. Safe to ignore.
          }
        },
      },
    },
  );
}
