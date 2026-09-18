-- Add the supervision account type in its own migration transaction.
alter type public.account_type add value if not exists 'SUPER_ADMIN';
