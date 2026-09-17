import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types/domain";

export interface SessionUser {
  id: string;
  email: string | null;
  accountType: AccountType | null;
}

/**
 * Reads the authenticated identity from Supabase. Authorization data is kept
 * separate from Auth metadata; until the Phase 2 generated database types are
 * integrated, accountType deliberately remains null rather than trusting
 * client-writable user_metadata.
 *
 * A transient Supabase/configuration error is treated as no verified session
 * so protected layouts can fail closed instead of rendering the global error
 * boundary.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      accountType: null,
    };
  } catch {
    return null;
  }
}
