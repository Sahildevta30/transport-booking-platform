import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Completes Supabase's PKCE email-confirmation flow on the server so the
 * resulting auth session is written to the request's cookie store before
 * the user reaches a protected page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  // Only permit an internal path. Never turn this endpoint into an open redirect.
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/customer/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
