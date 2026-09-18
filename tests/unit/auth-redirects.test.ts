import { describe, expect, it } from "vitest";

import {
  AREA_LOGIN_PATH,
  areaForPath,
  canAccessArea,
  dashboardForAccountType,
  isAreaLoginPath,
  isRoleArea,
  loginPathForPath,
  resolvePostLoginPath,
  safeInternalPath,
} from "@/lib/auth/redirects";

describe("areaForPath", () => {
  it("maps each protected prefix to its area", () => {
    expect(areaForPath("/customer/dashboard")).toBe("customer");
    expect(areaForPath("/admin/dashboard")).toBe("partner");
    expect(areaForPath("/admin")).toBe("partner");
    expect(areaForPath("/super-admin")).toBe("super-admin");
    expect(areaForPath("/super-admin/anything")).toBe("super-admin");
  });

  it("treats public pages as unprotected", () => {
    expect(areaForPath("/")).toBeNull();
    expect(areaForPath("/search")).toBeNull();
    expect(areaForPath("/partner/apply")).toBeNull();
  });

  it("treats login entry pages as public, including /super-admin/login", () => {
    // Without this the proxy would redirect /super-admin/login to itself.
    expect(areaForPath("/super-admin/login")).toBeNull();
    expect(isAreaLoginPath("/super-admin/login")).toBe(true);
    expect(isAreaLoginPath("/partner/login")).toBe(true);
    expect(isAreaLoginPath("/login")).toBe(true);
    expect(isAreaLoginPath("/partner/apply")).toBe(false);
  });

  it("does not match lookalike prefixes", () => {
    expect(areaForPath("/administrative-info")).toBeNull();
    expect(areaForPath("/customers-guide")).toBeNull();
  });
});

describe("loginPathForPath", () => {
  it("sends each protected area to the login page that owns it", () => {
    expect(loginPathForPath("/customer/bookings")).toBe("/login");
    expect(loginPathForPath("/admin/vehicles")).toBe("/partner/login");
    expect(loginPathForPath("/super-admin")).toBe("/super-admin/login");
  });
});

describe("safeInternalPath", () => {
  it("accepts same-origin paths", () => {
    expect(safeInternalPath("/customer/dashboard")).toBe("/customer/dashboard");
    expect(safeInternalPath("/search?from=DEL")).toBe("/search?from=DEL");
  });

  it("rejects anything that could leave the origin", () => {
    expect(safeInternalPath("//evil.example.com")).toBeNull();
    expect(safeInternalPath("/\\evil.example.com")).toBeNull();
    expect(safeInternalPath("https://evil.example.com")).toBeNull();
    expect(safeInternalPath("javascript:alert(1)")).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath("")).toBeNull();
  });
});

describe("canAccessArea", () => {
  it("keeps the three areas disjoint", () => {
    expect(canAccessArea("CUSTOMER", "customer")).toBe(true);
    expect(canAccessArea("CUSTOMER", "partner")).toBe(false);
    expect(canAccessArea("CUSTOMER", "super-admin")).toBe(false);

    expect(canAccessArea("ADMIN", "partner")).toBe(true);
    expect(canAccessArea("STAFF", "partner")).toBe(true);
    expect(canAccessArea("ADMIN", "super-admin")).toBe(false);

    expect(canAccessArea("SUPER_ADMIN", "super-admin")).toBe(true);
    // Supervision is read-only: it must not inherit partner write access.
    expect(canAccessArea("SUPER_ADMIN", "partner")).toBe(false);
  });

  it("denies an account with no profile row", () => {
    expect(canAccessArea(null, "customer")).toBe(false);
    expect(canAccessArea(null, "partner")).toBe(false);
    expect(canAccessArea(null, "super-admin")).toBe(false);
  });
});

describe("dashboardForAccountType", () => {
  it("lands each account type on its own dashboard", () => {
    expect(dashboardForAccountType("CUSTOMER")).toBe("/customer/dashboard");
    expect(dashboardForAccountType("ADMIN")).toBe("/admin/dashboard");
    expect(dashboardForAccountType("STAFF")).toBe("/admin/dashboard");
    expect(dashboardForAccountType("SUPER_ADMIN")).toBe("/super-admin");
  });

  it("defaults an unknown/profile-less account to the customer area, never staff", () => {
    expect(dashboardForAccountType(null)).toBe("/customer/dashboard");
  });
});

describe("resolvePostLoginPath", () => {
  it("honours a requested destination the account is allowed to reach", () => {
    expect(resolvePostLoginPath("ADMIN", "/admin/vehicles")).toBe("/admin/vehicles");
    expect(resolvePostLoginPath("CUSTOMER", "/customer/bookings")).toBe("/customer/bookings");
    expect(resolvePostLoginPath("CUSTOMER", "/search?from=DEL")).toBe("/search?from=DEL");
  });

  it("ignores a destination the account is not authorized for", () => {
    expect(resolvePostLoginPath("CUSTOMER", "/admin/dashboard")).toBe("/customer/dashboard");
    expect(resolvePostLoginPath("CUSTOMER", "/super-admin")).toBe("/customer/dashboard");
    expect(resolvePostLoginPath("ADMIN", "/super-admin")).toBe("/admin/dashboard");
    expect(resolvePostLoginPath("SUPER_ADMIN", "/admin/dashboard")).toBe("/super-admin");
  });

  it("refuses to be used as an open redirect", () => {
    expect(resolvePostLoginPath("CUSTOMER", "//evil.example.com")).toBe("/customer/dashboard");
    expect(resolvePostLoginPath("CUSTOMER", "https://evil.example.com")).toBe(
      "/customer/dashboard",
    );
  });

  it("never bounces a signed-in user back to a login page", () => {
    expect(resolvePostLoginPath("CUSTOMER", "/login")).toBe("/customer/dashboard");
    expect(resolvePostLoginPath("ADMIN", "/partner/login?next=/admin")).toBe("/admin/dashboard");
    expect(resolvePostLoginPath("SUPER_ADMIN", "/super-admin/login")).toBe("/super-admin");
  });
});

describe("isRoleArea", () => {
  it("only accepts the three known areas", () => {
    expect(isRoleArea("customer")).toBe(true);
    expect(isRoleArea("partner")).toBe(true);
    expect(isRoleArea("super-admin")).toBe(true);
    expect(isRoleArea("admin")).toBe(false);
    expect(isRoleArea(null)).toBe(false);
  });
});

describe("AREA_LOGIN_PATH", () => {
  it("matches the URLs promised to the project owner", () => {
    expect(AREA_LOGIN_PATH).toEqual({
      customer: "/login",
      partner: "/partner/login",
      "super-admin": "/super-admin/login",
    });
  });
});
