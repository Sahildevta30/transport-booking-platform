import type { AccountType } from "@/types/domain";
import {
  canAccessAdminArea,
  canAccessCustomerArea,
  canAccessSupervisionArea,
} from "@/lib/auth/roles";

/**
 * Single source of truth for "which role area does this URL belong to,
 * which login page owns that area, and where does each account type land
 * after authenticating".
 *
 * Pure logic only — no session reading, no redirecting. Both the proxy
 * (edge/Node request layer), the /auth/redirect route handler and the
 * area layouts import from here so the three can never disagree about a
 * role boundary. The real gate is always the server-side check in
 * /auth/redirect and in each area layout; anything a client component
 * does with these helpers is UX only.
 */

export const ROLE_AREAS = ["customer", "partner", "super-admin"] as const;
export type RoleArea = (typeof ROLE_AREAS)[number];

/** Public, directly openable entry URL for each area. */
export const AREA_LOGIN_PATH: Record<RoleArea, string> = {
  customer: "/login",
  partner: "/partner/login",
  "super-admin": "/super-admin/login",
};

/** Landing page of each area once the account is authorized. */
export const AREA_DASHBOARD_PATH: Record<RoleArea, string> = {
  customer: "/customer/dashboard",
  partner: "/admin/dashboard",
  "super-admin": "/super-admin",
};

/**
 * Accepts only same-origin, non-protocol-relative paths. Anything else
 * (absolute URL, `//evil.com`, backslash trick) is rejected so a
 * `?next=` parameter can never become an open redirect.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/**
 * The login entry pages are public by definition — /super-admin/login
 * lives under the /super-admin prefix, so without this check the proxy
 * would treat it as protected and redirect it to itself forever.
 */
export function isAreaLoginPath(pathname: string): boolean {
  return (Object.values(AREA_LOGIN_PATH) as string[]).includes(pathname);
}

/** Which protected area a pathname belongs to, or null for public pages. */
export function areaForPath(pathname: string): RoleArea | null {
  if (isAreaLoginPath(pathname)) return null;
  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) return "super-admin";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "partner";
  if (pathname === "/customer" || pathname.startsWith("/customer/")) return "customer";
  return null;
}

export function isRoleArea(value: string | null | undefined): value is RoleArea {
  return !!value && (ROLE_AREAS as readonly string[]).includes(value);
}

/** The login page that owns a given protected path. */
export function loginPathForPath(pathname: string): string {
  const area = areaForPath(pathname);
  return AREA_LOGIN_PATH[area ?? "customer"];
}

export function canAccessArea(accountType: AccountType | null, area: RoleArea): boolean {
  switch (area) {
    case "super-admin":
      return canAccessSupervisionArea(accountType);
    case "partner":
      return canAccessAdminArea(accountType);
    case "customer":
      return canAccessCustomerArea(accountType);
  }
}

/**
 * Where an authenticated account belongs by default. A null accountType
 * means the auth user has no profile row yet (or it could not be read) —
 * that account is treated as a plain customer, never as staff.
 */
export function dashboardForAccountType(accountType: AccountType | null): string {
  if (canAccessSupervisionArea(accountType)) return AREA_DASHBOARD_PATH["super-admin"];
  if (canAccessAdminArea(accountType)) return AREA_DASHBOARD_PATH.partner;
  return AREA_DASHBOARD_PATH.customer;
}

/**
 * Post-login destination, given what the user asked for and what their
 * server-verified account type actually allows.
 *
 * Honours `next` only when the account is genuinely authorized for the
 * area that path belongs to; otherwise it silently falls back to the
 * account's own dashboard rather than bouncing them into a page that
 * will just redirect them out again.
 */
export function resolvePostLoginPath(
  accountType: AccountType | null,
  requestedNext: string | null | undefined,
): string {
  const next = safeInternalPath(requestedNext);
  if (!next) return dashboardForAccountType(accountType);

  // Never bounce a freshly authenticated user back onto a login page.
  const nextPathname = next.split("?")[0] ?? next;
  if (isAreaLoginPath(nextPathname)) return dashboardForAccountType(accountType);

  const area = areaForPath(nextPathname);
  if (!area) return next; // a public page such as /search — always fine
  if (canAccessArea(accountType, area)) return next;

  return dashboardForAccountType(accountType);
}
