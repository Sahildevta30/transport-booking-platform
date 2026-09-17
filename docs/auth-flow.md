# Production auth flow

Register → Supabase confirmation email → `/auth/callback?code=…` → server-side `exchangeCodeForSession()` → authenticated customer dashboard. Normal password login creates the same cookie-backed Supabase session and routes to the customer dashboard.
