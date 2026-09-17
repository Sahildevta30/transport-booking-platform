import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types/domain";

export interface SessionUser {
  id: string;
  email: string | null;
  accountType: AccountType | null;
}

/** Reads the verified Supabase identity and server-authoritative platform role. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      accountType: profile?.account_type ?? null,
    };
  } catch {
    return null;
  }
}
