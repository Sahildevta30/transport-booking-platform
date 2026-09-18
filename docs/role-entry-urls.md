# Role entry URLs

One production domain, three clearly openable doors. Nobody should ever have to
type a hidden dashboard route.

## The URLs

Replace `<PRODUCTION_DOMAIN>` with the verified Vercel **Production** domain
(not a preview alias) before handing this to the project owner.

| Purpose | Path |
| --- | --- |
| Main website | `/` |
| Customer login | `/login` |
| Customer register | `/register` |
| Customer dashboard | `/customer/dashboard` |
| Partner landing | `/partner` |
| Partner login | `/partner/login` |
| Partner onboarding | `/partner/apply` |
| Partner dashboard | `/admin/dashboard` |
| Super admin login | `/super-admin/login` |
| Super admin dashboard | `/super-admin` |

Discoverability: the public header links **Partner With Us** → `/partner`, plus
**Log in** / **Sign up**. The footer carries a Partners column. `/super-admin/login`
is deliberately not advertised — it works by direct URL for platform staff and is
`noindex`.

## One auth system, three doors

There is no separate partner or super-admin credential store. All three login
pages sign in against the same Supabase Auth users table. "Partner" and
"super admin" are authorization facts (`profiles.account_type`), not separate
logins.

| account_type | Home |
| --- | --- |
| `CUSTOMER` | `/customer/dashboard` |
| `ADMIN`, `STAFF` | `/admin/dashboard` |
| `SUPER_ADMIN` | `/super-admin` |
| `null` (no profile row) | `/customer/dashboard` — never staff |

## How the role decision is made

The login forms are client components, so they can only know that a password was
accepted. They never choose a dashboard. On success they navigate to:

```
/auth/redirect?area=<customer|partner|super-admin>&next=<internal path>
```

`app/auth/redirect/route.ts` re-reads the session server-side, loads
`profiles.account_type` via `getSessionUser()`, and only then issues the
redirect. `?area` and `?next` influence *where you may be sent*, never *what you
are allowed to be*. Nothing role-related is read from localStorage.

Shared logic lives in `lib/auth/redirects.ts` and is imported by the proxy, the
route handler and every area layout, so the three cannot drift apart on a role
boundary.

## Deny behaviour

| Situation | Result |
| --- | --- |
| Unauthenticated → `/customer/*` | `/login?next=…` |
| Unauthenticated → `/admin/*` | `/partner/login?next=…` |
| Unauthenticated → `/super-admin/*` | `/super-admin/login?next=…` |
| Customer → `/admin/*` | `/partner/apply` (onboarding, not an error) |
| Customer or partner → `/super-admin/*` | their own dashboard |
| Customer or partner signs in at `/super-admin/login` | `/super-admin/login?error=forbidden` |
| Super admin → `/admin/*` | `/super-admin` — supervision stays read-only and never inherits partner write access |
| Staff account → `/customer/*` | their own dashboard |

`?next` is honoured only when it is an internal path **and** the verified account
type is authorized for the area that path belongs to. Otherwise it falls back to
the account's own dashboard. Protocol-relative and absolute URLs are rejected, so
it cannot become an open redirect.

There is no signup on `/super-admin/login` and no code path that writes
`account_type = 'SUPER_ADMIN'`. That grant is made out of band in the database.

## Defence in depth

1. `proxy.ts` — is anyone signed in at all? Fails closed if Supabase is
   unconfigured or unreachable.
2. Area layouts (`app/customer`, `app/admin`, `app/super-admin`) — is *this*
   account allowed in this area? Every page in the area renders inside its
   layout, so no route can skip the check.
3. Supabase RLS — the real data boundary. The checks above are UX and defence in
   depth; RLS is what actually stops one partner reading another's rows.

## Pre-handoff verification

Run against the real Production domain, not a preview:

- [ ] `/login` → customer credentials → lands on `/customer/dashboard`
- [ ] `/partner/login` → partner credentials → lands on `/admin/dashboard`
- [ ] `/partner/login` → customer with no organization → lands on `/partner/apply`
- [ ] `/partner/apply` → business details + terms → activates → `/admin/dashboard`
- [ ] `/super-admin/login` → super admin credentials → lands on `/super-admin`
- [ ] `/super-admin/login` → customer credentials → refused, stays out
- [ ] Signed in as customer, open `/admin/dashboard` → redirected, no admin data rendered
- [ ] Signed in as customer, open `/super-admin` → redirected
- [ ] Signed in as partner, open `/super-admin` → redirected
- [ ] Signed out, open `/customer/bookings` → `/login?next=/customer/bookings`, and after login
      you land on `/customer/bookings` (not the dashboard)
- [ ] `Partner With Us` is visible in the public header
