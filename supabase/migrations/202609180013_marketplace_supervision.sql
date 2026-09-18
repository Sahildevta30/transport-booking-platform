-- Marketplace supervision, partner tenancy and onboarding.
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
  where p.id=auth.uid() and p.account_type::text='SUPER_ADMIN'
));

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from public.profiles where id=auth.uid() and account_type::text='SUPER_ADMIN') $$;

revoke execute on function public.is_super_admin() from public,anon;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.supervision_overview()
returns table(
  organization_id uuid, organization_name text, vehicle_id uuid, vehicle_label text,
  registration_number text, vehicle_status public.vehicle_status, trip_id uuid,
  trip_status public.trip_status, departure_at timestamptz, arrival_at timestamptz,
  booking_id uuid, customer_id uuid, booking_status public.booking_status,
  booking_amount numeric, base_price numeric, discount_amount numeric,
  origin_name text, destination_name text
)
language sql stable security definer set search_path=public,pg_temp
as $$
  select o.id,o.name,v.id,v.label,v.registration_number,v.status,t.id,t.status,
         t.departure_at,t.arrival_at,b.id,b.user_id,b.status,b.amount,t.base_price,
         case when b.id is null then null else greatest(t.base_price-b.amount,0) end,
         origin.name,destination.name
  from public.organizations o
  join public.vehicles v on v.organization_id=o.id
  left join public.trips t on t.vehicle_id=v.id
  left join public.bookings b on b.trip_id=t.id
  left join public.routes r on r.id=t.route_id
  left join public.locations origin on origin.id=r.origin_location_id
  left join public.locations destination on destination.id=r.destination_location_id
  where public.is_super_admin();
$$;

revoke execute on function public.supervision_overview() from public,anon;
grant execute on function public.supervision_overview() to authenticated;


create or replace function public.current_organization_ids()
returns setof uuid language sql stable security definer set search_path=public,pg_temp
as $$
  select organization_id from public.organization_memberships where user_id=auth.uid()
$$;
revoke execute on function public.current_organization_ids() from public,anon;
grant execute on function public.current_organization_ids() to authenticated;

-- Partner admins can operate only their own organizations. Super Admin receives no write policy.
create policy "members can read own organization vehicles" on public.vehicles
for select to authenticated using (organization_id in (select public.current_organization_ids()));
create policy "admins can insert own organization vehicles" on public.vehicles
for insert to authenticated with check (
  organization_id in (
    select om.organization_id from public.organization_memberships om
    where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
  )
);
create policy "admins can update own organization vehicles" on public.vehicles
for update to authenticated using (
  organization_id in (
    select om.organization_id from public.organization_memberships om
    where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
  )
) with check (
  organization_id in (
    select om.organization_id from public.organization_memberships om
    where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
  )
);


create policy "members can read own organization routes" on public.routes
for select to authenticated using (organization_id in (select public.current_organization_ids()));
create policy "admins can insert own organization routes" on public.routes
for insert to authenticated with check (organization_id in (
  select om.organization_id from public.organization_memberships om where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
));
create policy "admins can update own organization routes" on public.routes
for update to authenticated using (organization_id in (
  select om.organization_id from public.organization_memberships om where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
)) with check (organization_id in (
  select om.organization_id from public.organization_memberships om where om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
));

create policy "members can read own fleet trips" on public.trips
for select to authenticated using (exists (
  select 1 from public.vehicles v where v.id=trips.vehicle_id and v.organization_id in (select public.current_organization_ids())
));
create policy "admins can insert own fleet trips" on public.trips
for insert to authenticated with check (exists (
  select 1 from public.vehicles v join public.organization_memberships om on om.organization_id=v.organization_id
  where v.id=trips.vehicle_id and om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
));
create policy "admins can update own fleet trips" on public.trips
for update to authenticated using (exists (
  select 1 from public.vehicles v join public.organization_memberships om on om.organization_id=v.organization_id
  where v.id=trips.vehicle_id and om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
)) with check (exists (
  select 1 from public.vehicles v join public.organization_memberships om on om.organization_id=v.organization_id
  where v.id=trips.vehicle_id and om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
));


create table if not exists public.partner_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_name text not null check (char_length(trim(organization_name)) between 2 and 160),
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id,terms_version)
);
alter table public.partner_terms_acceptances enable row level security;
create policy "users can read own partner acceptance" on public.partner_terms_acceptances
for select to authenticated using (user_id=auth.uid());
create policy "users can accept partner terms" on public.partner_terms_acceptances
for insert to authenticated with check (user_id=auth.uid());

create or replace function public.activate_partner(p_organization_name text,p_terms_version text)
returns uuid language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(p_organization_name)) < 2 then raise exception 'Organization name required'; end if;
  if coalesce(trim(p_terms_version),'') <> '2026-09-18' then raise exception 'Current terms must be accepted'; end if;
  if exists(select 1 from public.organization_memberships where user_id=auth.uid()) then raise exception 'Partner membership already exists'; end if;
  insert into public.partner_terms_acceptances(user_id,organization_name,terms_version) values(auth.uid(),trim(p_organization_name),p_terms_version);
  insert into public.organizations(name) values(trim(p_organization_name)) returning id into v_org;
  insert into public.organization_memberships(organization_id,user_id,role) values(v_org,auth.uid(),'OWNER');
  update public.profiles set account_type='ADMIN',updated_at=now() where id=auth.uid() and account_type='CUSTOMER';
  return v_org;
end $$;
revoke execute on function public.activate_partner(text,text) from public,anon;
grant execute on function public.activate_partner(text,text) to authenticated;


-- Partner booking visibility and operation. Customer-owned policies remain independent.
create policy "members can read own fleet bookings" on public.bookings
for select to authenticated using (exists (
  select 1 from public.trips t
  join public.vehicles v on v.id=t.vehicle_id
  where t.id=bookings.trip_id and v.organization_id in (select public.current_organization_ids())
));
create policy "admins can update own fleet bookings" on public.bookings
for update to authenticated using (exists (
  select 1 from public.trips t
  join public.vehicles v on v.id=t.vehicle_id
  join public.organization_memberships om on om.organization_id=v.organization_id
  where t.id=bookings.trip_id and om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
)) with check (exists (
  select 1 from public.trips t
  join public.vehicles v on v.id=t.vehicle_id
  join public.organization_memberships om on om.organization_id=v.organization_id
  where t.id=bookings.trip_id and om.user_id=auth.uid() and om.role in ('OWNER','ADMIN')
));

create policy "members can read own organizations" on public.organizations
for select to authenticated using (id in (select public.current_organization_ids()));
