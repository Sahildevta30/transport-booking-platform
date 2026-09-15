import type { AccountType, Role } from "@/types/domain";

/**
 * Central authorization abstraction. Pages and Server Actions should call
 * these helpers rather than comparing `accountType`/`role` strings inline —
 * that keeps every authorization decision in one auditable place, and
 * means Phase 2's real `roles`/`permissions` tables can replace the
 * internals here without touching call sites.
 *
 * IMPORTANT: this file is intentionally logic-only and does no redirecting
 * or session reading itself (see lib/auth/session.ts for that). Client
 * components may import the pure helpers below for UI decisions (e.g.
 * hiding a nav link), but the server-side check via getSessionUser() is
 * always the real gate — never rely on a client-side check alone.
 */

const ADMIN_AREA_ACCOUNT_TYPES: readonly AccountType[] = ["ADMIN", "STAFF"];

export function canAccessAdminArea(accountType: AccountType | null): boolean {
  if (!accountType) return false;
  return ADMIN_AREA_ACCOUNT_TYPES.includes(accountType);
}

export function canAccessCustomerArea(accountType: AccountType | null): boolean {
  return accountType === "CUSTOMER";
}

/** Placeholder for the fine-grained permission system Phase 2 will build (see `permissions` domain table). */
export function hasRole(
  userRoles: readonly Role[] | null | undefined,
  required: Role,
): boolean {
  if (!userRoles) return false;
  return userRoles.includes(required);
}
