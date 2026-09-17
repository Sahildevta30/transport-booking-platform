# Authentication callback security

The Supabase PKCE callback exchanges the authorization code on the server and only redirects to an internal path. Values beginning with `//` are rejected so the callback cannot be used as an open redirect. Authorization must continue to use server-verified session/profile data and database RLS; callback success alone never grants an elevated role.
