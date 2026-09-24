-- Add two-wheeler inventory categories for partner-managed full-vehicle bookings.
-- Production uses FULL_VEHICLE_BOOKING as the canonical full-vehicle mode.
-- Reuse the existing stored value rather than hard-coding an enum cast.

do $migration$
begin
  if to_regclass('public.vehicle_types') is null then
    raise exception 'Expected public.vehicle_types table is missing';
  end if;

  if not exists (
    select 1
    from public.vehicle_types
    where booking_mode::text = 'FULL_VEHICLE_BOOKING'
  ) then
    raise exception 'FULL_VEHICLE_BOOKING mode is not present in vehicle_types; stop migration';
  end if;
end
$migration$;

insert into public.vehicle_types (name, booking_mode)
select 'Bike', booking_mode
from public.vehicle_types
where booking_mode::text = 'FULL_VEHICLE_BOOKING'
limit 1
on conflict do nothing;

insert into public.vehicle_types (name, booking_mode)
select 'Scooty', booking_mode
from public.vehicle_types
where booking_mode::text = 'FULL_VEHICLE_BOOKING'
limit 1
on conflict do nothing;
