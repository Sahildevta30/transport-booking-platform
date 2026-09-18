import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { areaForPath, loginPathForPath } from "@/lib/auth/redirects";

/**
 * Next.js 16 proxy (formerly "middleware") — runs on every request (see
 * `config.matcher` below), on the Node.js runtime.
 *
 * Two jobs, both server-side (never trust a client-side redirect alone):
 *  1. Refresh the Supabase auth cookie so sessions don't silently expire
 *     mid-visit.
 *  2. Block unauthenticated access to /customer, /admin and /super-admin before the
 *     page even renders. Role-specific checks (customer vs admin vs
 *     staff) happen deeper, in each area's layout, once the `profiles`
 *     table exists in Phase 2 — this proxy only answers
 *     "is anyone logged in at all?".
 *
 * Deliberately resilient to Supabase being unconfigured or unreachable:
 * a public marketing page has no reason to 500 just because
 * NEXT_PUBLIC_SUPABASE_URL isn't set yet, or Supabase is briefly down.
 * Protected routes still fail CLOSED in that situation (redirect to
 * login) rather than silently letting anyone through — this is a
 * robustness improvement, not a security relaxation.
 */
export async function proxy(request: NextRequest) {
  // `areaForPath` is the single shared definition of what counts as a
  // protected area (see lib/auth/redirects.ts), so this proxy and the
  // area layouts can never drift apart on that boundary.
  const isProtectedRoute = areaForPath(request.nextUrl.pathname) !== null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase isn't configured at all (e.g. local dev before .env.local
  // is filled in). Public routes proceed untouched; protected routes
  // can't verify a session, so they fail closed instead of crashing.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
      return redirectToLogin(request);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtectedRoute && !user) {
      return redirectToLogin(request);
    }

    return response;
  } catch {
    // Supabase is configured but unreachable (network blip, wrong
    // project, etc.). Same fail-closed rule: don't crash a public page
    // over it, but never let an unverifiable session into /customer or
    // /admin either.
    if (isProtectedRoute) {
      return redirectToLogin(request);
    }
    return response;
  }
}

/**
 * Sends an unauthenticated visitor to the login page that OWNS the area
 * they tried to reach (/login, /partner/login or /super-admin/login) and
 * preserves their intended destination as `next` — the same parameter
 * name the login pages and /auth/redirect read. These used to disagree
 * (`redirectTo` here vs `next` there), which silently dropped every
 * deep link and dumped everyone on the customer dashboard.
 */
function redirectToLogin(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const loginUrl = new URL(loginPathForPath(pathname), request.url);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization
     * files, so the session cookie stays fresh across the whole app.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
