-- Production reconciliation step 1.
-- Live production uses public.app_account_type (CUSTOMER, STAFF, ADMIN).
-- Keep the enum change isolated because PostgreSQL requires a newly-added enum
-- value to be committed before later migrations safely reference it.
do $$
begin
  if to_regtype('public.app_account_type') is null then
    raise exception 'Expected live enum public.app_account_type is missing; stop reconciliation';
  end if;
end $$;

alter type public.app_account_type add value if not exists 'SUPER_ADMIN';
