# Production auth verification checklist

1. Vercel production has the correct Supabase project URL and browser-safe publishable key.
2. Supabase Auth Site URL is the production Vercel domain.
3. Allowed redirect URLs include the production domain.
4. New registration creates both `auth.users` and `public.profiles` rows.
5. Email confirmation reaches `/auth/callback`, exchanges the PKCE code, and establishes a session.
6. Login reaches `/customer/dashboard` without the global error boundary.
7. Service-role credentials remain server-only and are never exposed to browser code.
