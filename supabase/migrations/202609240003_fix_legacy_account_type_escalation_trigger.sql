-- Production reconciliation step 7.
-- Reconcile the legacy account-type immutability trigger with the validated
-- partner activation flow.
--
-- activate_partner() creates both the current terms acceptance and OWNER
-- membership before promoting the same authenticated CUSTOMER to ADMIN. Those
-- rows are created inside the same transaction, so they provide the capability
-- proof for this one allowed transition. Every other account_type change stays
-- blocked unless it is executed with the service_role JWT.

create or replace function public.prevent_account_type_escalation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $guard$
begin
  if new.account_type is not distinct from old.account_type then
    return new;
  end if;

  -- Preserve trusted service-role maintenance.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  -- Permit only the partner onboarding transition for the authenticated user.
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
$guard$;

-- The existing enforce_profiles_account_type_immutable trigger already calls
-- this function. Replacing the function updates its behavior without disabling
-- or dropping the protection trigger.
