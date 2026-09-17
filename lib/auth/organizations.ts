import "server-only";

/**
 * Organization-scoped authorization is part of the Phase 2 domain model.
 * The concrete database-backed helpers are integrated together with the
 * generated/verified Phase 2 Database type so application code never relies
 * on unsafe casts or client-provided role metadata.
 */
export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: "OWNER" | "ADMIN" | "STAFF" | "DRIVER" | "AGENT";
}
