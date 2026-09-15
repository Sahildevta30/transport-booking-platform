import { describe, expect, it } from "vitest";

import { canAccessAdminArea, canAccessCustomerArea, hasRole } from "@/lib/auth/roles";

describe("canAccessAdminArea", () => {
  it("allows ADMIN and STAFF", () => {
    expect(canAccessAdminArea("ADMIN")).toBe(true);
    expect(canAccessAdminArea("STAFF")).toBe(true);
  });

  it("denies CUSTOMER and null", () => {
    expect(canAccessAdminArea("CUSTOMER")).toBe(false);
    expect(canAccessAdminArea(null)).toBe(false);
  });
});

describe("canAccessCustomerArea", () => {
  it("only allows CUSTOMER", () => {
    expect(canAccessCustomerArea("CUSTOMER")).toBe(true);
    expect(canAccessCustomerArea("ADMIN")).toBe(false);
    expect(canAccessCustomerArea(null)).toBe(false);
  });
});

describe("hasRole", () => {
  it("returns false for null/undefined role lists", () => {
    expect(hasRole(null, "ADMIN")).toBe(false);
    expect(hasRole(undefined, "ADMIN")).toBe(false);
  });

  it("checks membership correctly", () => {
    expect(hasRole(["DRIVER", "AGENT"], "DRIVER")).toBe(true);
    expect(hasRole(["DRIVER"], "ADMIN")).toBe(false);
  });
});
