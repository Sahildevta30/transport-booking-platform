-- Production reconciliation step 6.
-- Fix partner activation under a SECURITY DEFINER RPC.
--
-- In a SECURITY DEFINER function current_user remains the function owner, so the
-- profile guard cannot reliably identify the caller from current_user. Validate
-- the controlled promotion using auth.uid() plus the rows activate_partner has
-- already created in the same transaction.

create or replace function public.protect_profile_account_type()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
begin
  if new.account_type is not distinct from old.account_type then
    return new;
  end if;

  if old.account_type::text = 'CUSTOMER'
     and new.account_type::text = 'ADMIN'
     and auth.uid() = new.id
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

  raise exception 'account_type can only be changed by a trusted server-side process';
end
$$;

drop trigger if exists protect_profile_account_type on public.profiles;
create trigger protect_profile_account_type
before update of account_type on public.profiles
for each row execute function public.protect_profile_account_type();
