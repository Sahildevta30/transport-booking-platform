-- Marketplace supervision foundation.
-- SUPER_ADMIN is intentionally observation-only. No mutation policies are granted here.

alter type public.account_type add value if not exists 'SUPER_ADMIN';

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','STAFF')),
  created_at timestamptz not null default now(),
  unique (organization_id,user_id)
);

alter table public.organization_memberships enable row level security;

create policy "members can read own memberships"
on public.organization_memberships for select to authenticated
using (user_id = auth.uid());

create policy "super admins can supervise memberships"
on public.organization_memberships for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id=auth.uid() and p.account_type='SUPER_ADMIN'
));

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.profiles where id=auth.uid() and account_type='SUPER_ADMIN') $$;

revoke execute on function public.is_super_admin() from public,anon;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.supervision_overview()
returns table(
  organization_id uuid, organization_name text, vehicle_id uuid, vehicle_label text,
  registration_number text, vehicle_status public.vehicle_status, trip_id uuid,
  trip_status public.trip_status, departure_at timestamptz, arrival_at timestamptz,
  booking_id uuid, customer_id uuid, booking_status public.booking_status,
  booking_amount numeric, base_price numeric, discount_amount numeric
)
language sql stable security definer set search_path=public,pg_temp
as $$
  select o.id,o.name,v.id,v.label,v.registration_number,v.status,t.id,t.status,
         t.departure_at,t.arrival_at,b.id,b.user_id,b.status,b.amount,t.base_price,
         greatest(t.base_price-b.amount,0)
  from public.organizations o
  join public.vehicles v on v.organization_id=o.id
  left join public.trips t on t.vehicle_id=v.id
  left join public.bookings b on b.trip_id=t.id
  where public.is_super_admin();
$$;

revoke execute on function public.supervision_overview() from public,anon;
grant execute on function public.supervision_overview() to authenticated;
