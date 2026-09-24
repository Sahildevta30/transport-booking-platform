-- India Post state-circle PDFs identify postal division, not administrative district.
-- The previous geo_post_offices catalog is empty in production at preparation time.
-- Keep district nullable until an independently verified district mapping exists.
begin;
alter table public.geo_post_offices add column if not exists postal_division text;
update public.geo_post_offices set postal_division = district where postal_division is null;
alter table public.geo_post_offices drop constraint if exists geo_post_offices_pkey;
alter table public.geo_post_offices alter column district drop not null;
alter table public.geo_post_offices alter column postal_division set not null;
alter table public.geo_post_offices add constraint geo_post_offices_pkey
  primary key (state_code, postal_division, office_name, pincode);
create index if not exists geo_post_offices_division_idx
  on public.geo_post_offices (state_code, postal_division);
commit;
