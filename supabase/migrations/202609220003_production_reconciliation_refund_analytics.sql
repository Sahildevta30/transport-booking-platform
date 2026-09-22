-- Production reconciliation step 3.
-- Complete refund metadata and repair platform-wide analytics authorization.

alter table public.payments
  add column if not exists provider_refund_id text,
  add column if not exists refund_amount numeric(12,2),
  add column if not exists refund_initiated_at timestamptz;

create unique index if not exists payments_provider_refund_id_idx
  on public.payments(provider_refund_id)
  where provider_refund_id is not null;

create index if not exists analytics_events_type_created_idx
  on public.analytics_events(event_type,created_at desc);
create index if not exists analytics_events_user_created_idx
  on public.analytics_events(user_id,created_at desc)
  where user_id is not null;

create or replace function public.analytics_summary(p_days integer default 30)
returns table(
  event_type public.analytics_event_type,
  event_count bigint,
  unique_users bigint
)
language sql stable security definer set search_path=public,pg_temp
as $$
  select a.event_type,count(*)::bigint,count(distinct a.user_id)::bigint
  from public.analytics_events a
  where public.is_super_admin()
    and a.created_at >= now() - make_interval(
      days => greatest(1,least(coalesce(p_days,30),365))
    )
  group by a.event_type
  order by count(*) desc;
$$;
revoke execute on function public.analytics_summary(integer) from public,anon;
grant execute on function public.analytics_summary(integer) to authenticated;
