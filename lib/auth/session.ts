import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types/domain";

export interface SessionUser {
  id: string;
  email: string | null;
  /**
   * Placeholder until the `profiles` table (see docs/database/domain-model.md)
   * exists in Phase 2. Auth identity and account type are deliberately kept
   * separate: Supabase Auth answers "who is this?", the profiles table
   * answers "what can they do?" — never trust a client-supplied role.
   */
  accountType: AccountType | null;
}

/**
 * Reads the current authenticated user from the request's Supabase session.
 * Returns null when there is no session — callers decide what to do about
 * that (redirect, render a public view, etc.), this helper never redirects
 * itself so it stays safe to call from anywhere, including layouts.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    // TODO(Phase 2): look up account_type from `profiles` once that table
    // exists. Never read a role/account type out of user_metadata — that's
    // client-writable and must not be trusted for authorization.
    accountType: null,
  };
}
