-- Marketplace business verticals (categories).
-- Every organization belongs to exactly one category so the customer-facing
-- menu can show separate sections (vehicle rental / travel agency / trip
-- planner / ...) and partners in different categories never mix listings.
-- Per-company admin isolation is already handled by organization_memberships
-- + current_organization_ids(); this migration only adds the vertical layer
-- on top of it.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- RLS controls rows; grant SELECT so the public category picker can query them.
grant select on public.categories to anon, authenticated;

create policy "anyone can read active categories"
on public.categories for select to anon, authenticated
using (is_active);

create policy "super admins can read all categories"
on public.categories for select to authenticated
using (public.is_super_admin());

insert into public.categories (slug, name, display_order) values
  ('vehicle-rental', 'Vehicle rental', 1),
  ('travel-agency', 'Travel agency', 2),
  ('trip-planner', 'Trip planner', 3)
on conflict (slug) do nothing;

-- Organizations now belong to a category.
alter table public.organizations
  add column if not exists category_id uuid references public.categories(id);

-- Backfill any organizations created before this migration into
-- vehicle-rental, the only category the current routes/trips/vehicles
-- booking engine supports end-to-end today.
update public.organizations
set category_id = (select id from public.categories where slug = 'vehicle-rental')
where category_id is null;

alter table public.organizations
  alter column category_id set not null;

create index if not exists organizations_category_id_idx on public.organizations(category_id);

-- Partner activation now requires choosing a category. The (text,text)
-- signature is retired so a partner can no longer sign up without one.
drop function if exists public.activate_partner(text, text);

create or replace function public.activate_partner(
  p_organization_name text,
  p_terms_version text,
  p_category_slug text
)
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_org uuid;
  v_category_id uuid;
  v_name text := trim(p_organization_name);
  v_slug_base text;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id=auth.uid()
      and account_type::text='CUSTOMER'
  ) then
    raise exception 'Only customer accounts can activate a partner workspace';
  end if;

  if length(v_name) < 2 then
    raise exception 'Organization name required';
  end if;

  if coalesce(trim(p_terms_version),'') <> '2026-09-18' then
    raise exception 'Current terms must be accepted';
  end if;

  select id into v_category_id from public.categories
  where slug = p_category_slug and is_active;
  if v_category_id is null then
    raise exception 'Select a valid business category';
  end if;

  if exists (
    select 1
    from public.organization_memberships
    where user_id=auth.uid()
  ) then
    raise exception 'Partner membership already exists';
  end if;

  v_slug_base := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  if v_slug_base = '' then
    v_slug_base := 'partner';
  end if;

  v_slug := v_slug_base;
  if exists (select 1 from public.organizations where slug=v_slug) then
    v_slug := v_slug_base || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,8);
  end if;

  insert into public.partner_terms_acceptances(user_id, organization_name, terms_version)
  values(auth.uid(), v_name, p_terms_version);

  insert into public.organizations(name, slug, category_id)
  values(v_name, v_slug, v_category_id)
  returning id into v_org;

  insert into public.organization_memberships(organization_id, user_id, role)
  values(v_org, auth.uid(), 'OWNER');

  update public.profiles
  set account_type='ADMIN', updated_at=now()
  where id=auth.uid()
    and account_type::text='CUSTOMER';

  if not found then
    raise exception 'Partner account activation failed';
  end if;

  return v_org;
end
$$;

revoke execute on function public.activate_partner(text,text,text) from public,anon;
grant execute on function public.activate_partner(text,text,text) to authenticated;
