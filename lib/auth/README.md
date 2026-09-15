# Auth domain

`session.ts` — the single place that reads "who is the current user"
server-side. `roles.ts` — pure authorization decisions
(canAccessAdminArea, canAccessCustomerArea, hasRole), kept separate from
session reading. See docs/architecture/authentication-architecture.md.
