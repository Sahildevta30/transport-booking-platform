import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import {
  AREA_LOGIN_PATH,
  canAccessArea,
  dashboardForAccountType,
  isRoleArea,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";

/**
 * The single server-side gate every login funnels through.
 *
 * The login forms run in the browser, so they can only ever know "the
 * password was accepted" — they must never decide which dashboard the
 * account is entitled to. They hand off here instead, and this handler
 * re-reads the session and the server-authoritative `profiles.account_type`
 * (via getSessionUser) before issuing a redirect. Nothing about the role
 * decision comes from the client, localStorage or the URL.
 *
 * Query parameters:
 *   area  — which entry point the user came through (customer | partner |
 *           super-admin). Only used to pick the right error destination
 *           and the right "you're not that role" behaviour; it grants
 *           nothing on its own.
 *   next  — where they were originally headed. Honoured only if it is an
 *           internal path AND the verified account type is allowed there.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const areaParam = url.searchParams.get("area");
  const area = isRoleArea(areaParam) ? areaParam : "customer";
  const next = url.searchParams.get("next");

  const user = await getSessionUser();

  // Not actually signed in (cookie never landed, or it expired between
  // the form submit and this request): back to that area's login page.
  if (!user) {
    const loginUrl = new URL(AREA_LOGIN_PATH[area], url.origin);
    if (next) loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const { accountType } = user;

  // Signed in, but not authorized for the door they knocked on.
  if (!canAccessArea(accountType, area)) {
    // Super admin is deliberately a closed door: no self-service path in,
    // no hint about why. A signed-in customer or partner who opens
    // /super-admin/login simply gets told they can't enter.
    if (area === "super-admin") {
      return NextResponse.redirect(
        new URL("/super-admin/login?error=forbidden", url.origin),
      );
    }

    // Partner area, but this account has no partner organization yet.
    // That is an onboarding state, not an error — send them to apply.
    if (area === "partner" && !canAccessArea(accountType, "super-admin")) {
      return NextResponse.redirect(new URL("/partner/apply", url.origin));
    }

    return NextResponse.redirect(new URL(dashboardForAccountType(accountType), url.origin));
  }

  return NextResponse.redirect(
    new URL(resolvePostLoginPath(accountType, next), url.origin),
  );
}
