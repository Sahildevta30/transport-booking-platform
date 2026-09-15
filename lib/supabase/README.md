# Supabase clients

Three clients, three purposes — see
docs/architecture/backend-architecture.md for the full breakdown:

- `client.ts` — browser, anon key, RLS-scoped.
- `server.ts` — server (Server Components/Actions/Route Handlers), anon
  key, RLS-scoped, cookie-bound to the request.
- `admin.ts` — server-only (`import "server-only"` enforced), service
  role key, **bypasses RLS**. Never imported from client code.
