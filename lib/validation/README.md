# Validation schemas

Zod schemas shared between client forms (React Hook Form) and future
server-side validation (Server Actions), so the two can never drift
apart. `auth.ts` covers login/register/forgot-password today; add one
file per domain as forms are built in Phase 2+.
