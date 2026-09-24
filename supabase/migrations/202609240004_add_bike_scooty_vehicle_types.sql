-- Add two-wheeler inventory categories for partner-managed full-vehicle rentals.
-- The vehicle form reads directly from public.vehicle_types, so these rows
-- become available without hard-coding UI options.
--
-- This migration deliberately reuses the existing FULL_VEHICLE booking mode.
-- Pickup/return rental scheduling is a separate product flow and is not
-- represented by the current route/trip booking engine.

do $migration$
declare
  v_booking_mode_type regtype;
begin
  if to_regclass('public.vehicle_types') is null then
    raise exception 'Expected public.vehicle_types table is missing';
  end if;

  select a.atttypid::regtype
    into v_booking_mode_type
  from pg_attribute a
  where a.attrelid = 'public.vehicle_types'::regclass
    and a.attname = 'booking_mode'
    and a.attnum > 0
    and not a.attisdropped;

  if v_booking_mode_type is null then
    raise exception 'Expected public.vehicle_types.booking_mode column is missing';
  end if;

  -- Validate that the existing booking model supports FULL_VEHICLE before
  -- inserting anything. The actual inserts below use the column's implicit
  -- cast and therefore remain compatible whether booking_mode is text or enum.
  if not exists (
    select 1
    from public.vehicle_types
    where booking_mode::text = 'FULL_VEHICLE'
  ) then
    raise exception 'FULL_VEHICLE booking mode is not present in vehicle_types; stop migration';
  end if;
end
$migration$;

insert into public.vehicle_types (name, booking_mode)
select 'Bike', booking_mode
from public.vehicle_types
where booking_mode::text = 'FULL_VEHICLE'
limit 1
on conflict do nothing;

insert into public.vehicle_types (name, booking_mode)
select 'Scooty', booking_mode
from public.vehicle_types
where booking_mode::text = 'FULL_VEHICLE'
limit 1
on conflict do nothing;
