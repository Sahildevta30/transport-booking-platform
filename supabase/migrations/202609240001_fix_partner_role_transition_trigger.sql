-- Production reconciliation step 5.
-- Allow only the validated CUSTOMER -> ADMIN partner activation transition
-- while continuing to block arbitrary client-side account_type changes.

create or replace function public.protect_profile_account_type()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
begin
  if new.account_type is not distinct from old.account_type then
    return new;
  end if;

  -- activate_partner creates the OWNER membership and terms acceptance first,
  -- in the same transaction. Permit exactly that controlled promotion.
  if old.account_type::text = 'CUSTOMER'
     and new.account_type::text = 'ADMIN'
     and exists (
       select 1
       from public.organization_memberships om
       where om.user_id = new.id
         and om.role = 'OWNER'
     )
     and exists (
       select 1
       from public.partner_terms_acceptances pta
       where pta.user_id = new.id
         and pta.terms_version = '2026-09-18'
     ) then
    return new;
  end if;

  if current_user = 'authenticated' then
    raise exception 'account_type cannot be changed directly';
  end if;

  return new;
end
$$;

drop trigger if exists protect_profile_account_type on public.profiles;
create trigger protect_profile_account_type
before update of account_type on public.profiles
for each row execute function public.protect_profile_account_type();
