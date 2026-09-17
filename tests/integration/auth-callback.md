# Auth callback verification cases

- Missing `code` redirects to `/login?error=auth_callback`.
- Invalid/expired code redirects to `/login?error=auth_callback`.
- Valid PKCE code is exchanged server-side and redirects to `/customer/dashboard` by default.
- `next` accepts only an internal single-slash path; protocol-relative redirects are rejected.
- Registration supplies `/auth/callback?next=/customer/dashboard` as `emailRedirectTo`.
