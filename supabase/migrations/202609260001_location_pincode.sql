-- Partner-entered boarding points may carry a postal PIN for address context.
-- Postal offices are not boarding points; existing locations remain valid.
alter table public.locations add column if not exists pincode text;
alter table public.locations drop constraint if exists locations_pincode_format;
alter table public.locations add constraint locations_pincode_format
  check (pincode is null or pincode ~ '^[0-9]{6}$');
create index if not exists locations_state_pincode_idx on public.locations (state, pincode);
