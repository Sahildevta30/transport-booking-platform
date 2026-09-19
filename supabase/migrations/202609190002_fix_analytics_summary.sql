-- analytics_summary() (phase 10) was broken from the moment it was
-- written: it references `private.current_account_type()` and the type
-- `public.app_account_type`, and NEITHER exists anywhere in this schema
-- (no `private` schema is created by any migration in this repo, and the
-- real account-type enum used everywhere else is `public.account_type`,
-- read via `profiles.account_type`, e.g. is_super_admin()).
--
-- For a LANGUAGE sql function, Postgres resolves types and casts at
-- CREATE FUNCTION time, not at call time, so this statement cannot
-- actually run against a real database: it fails immediately with
-- "type public.app_account_type does not exist" (or an equivalent error
-- for the missing function/schema, whichever it hits first). Nothing else
-- in this repo ever calls analytics_summary(), so this had no observable
-- effect on the running app either way -- but it also means the two
-- `create index if not exists` statements that shared this migration
-- file may never have applied either, if migrations run one file per
-- transaction. Re-declaring them here with IF NOT EXISTS is therefore
-- also a correctness fix, not just a formality.
create index if not exists analytics_events_type_created_idx
  on public.analytics_events(event_type, created_at desc);
create index if not exists analytics_events_user_created_idx
  on public.analytics_events(user_id, created_at desc) where user_id is not null;

-- Separately: even with the reference fixed, gating on plain 'ADMIN'
-- (i.e. ANY partner admin, at ANY organization) would have been a
-- cross-tenant data leak. analytics_events has no organization_id and
-- cannot be reliably attributed to one -- several event types
-- (search_performed, route_viewed, ...) have no tie to a specific
-- operator at all -- so there is no correct way to scope this per
-- partner. The existing, established pattern for a platform-wide,
-- cross-tenant read in this schema is Super Admin only (see
-- supervision_overview()), so this now reuses that same is_super_admin()
-- check rather than the broken/overly-broad one it shipped with.
--
-- Partner-level analytics are unaffected: app/admin/analytics/page.tsx
-- never calls this function -- it computes its own metrics directly from
-- vehicles/trips/bookings filtered to the caller's own organization,
-- which stays correctly scoped by RLS regardless of this function.
create or replace function public.analytics_summary(p_days integer default 30)
returns table(event_type public.analytics_event_type, event_count bigint, unique_users bigint)
language sql stable security definer set search_path=public,pg_temp
as $$
  select a.event_type, count(*)::bigint, count(distinct a.user_id)::bigint
  from public.analytics_events a
  where public.is_super_admin()
    and a.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)))
  group by a.event_type
  order by count(*) desc;
$$;

revoke execute on function public.analytics_summary(integer) from public, anon;
grant execute on function public.analytics_summary(integer) to authenticated;
