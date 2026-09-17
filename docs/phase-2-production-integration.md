# Phase 2 production integration

This branch fixes the production authentication handoff while the complete Phase 2 database/domain snapshot is integrated separately.

## Included here

- Supabase PKCE callback at `/auth/callback`.
- Registration confirmation redirects through that callback.
- Protected session lookup fails closed instead of surfacing the global error boundary on transient auth/config failures.
- `/reset-password` completion page.

## Production configuration already established

- Supabase Site URL points at the production Vercel domain.
- Production browser client uses the project URL and publishable key.
- Email confirmation has been verified against the live Supabase project.

Never expose the Supabase service-role key to client code or a `NEXT_PUBLIC_*` environment variable.
