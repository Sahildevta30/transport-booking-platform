-- Production reconciliation step 4.
-- Fix partner activation for the live organizations schema, where slug is NOT NULL.

create or replace function public.activate_partner(
  p_organization_name text,
  p_terms_version text
)
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_org uuid;
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

  if exists (
    select 1
    from public.organization_memberships
    where user_id=auth.uid()
  ) then
    raise exception 'Partner membership already exists';
  end if;

  -- Generate a readable slug from the organization name. If normalization
  -- produces an empty slug, use "partner" as the stable base.
  v_slug_base := trim(both '-' from regexp_replace(
    lower(v_name),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
  if v_slug_base = '' then
    v_slug_base := 'partner';
  end if;

  v_slug := v_slug_base;
  if exists (select 1 from public.organizations where slug=v_slug) then
    v_slug := v_slug_base || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,8);
  end if;

  insert into public.partner_terms_acceptances(
    user_id,
    organization_name,
    terms_version
  )
  values(
    auth.uid(),
    v_name,
    p_terms_version
  );

  insert into public.organizations(name,slug)
  values(v_name,v_slug)
  returning id into v_org;

  insert into public.organization_memberships(
    organization_id,
    user_id,
    role
  )
  values(v_org,auth.uid(),'OWNER');

  update public.profiles
  set account_type='ADMIN',
      updated_at=now()
  where id=auth.uid()
    and account_type::text='CUSTOMER';

  if not found then
    raise exception 'Partner account activation failed';
  end if;

  return v_org;
end
$$;

revoke execute on function public.activate_partner(text,text) from public,anon;
grant execute on function public.activate_partner(text,text) to authenticated;
