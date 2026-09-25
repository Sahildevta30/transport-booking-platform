-- Customers can discover only active fleet and future scheduled trips.
-- A customer can continue viewing a booked trip and its vehicle afterwards.
create or replace function public.has_own_booking_on_trip(p_trip_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$
  select exists (
    select 1 from public.bookings b
    where b.trip_id=p_trip_id and b.user_id=(select auth.uid())
  );
$$;

create or replace function public.has_own_booking_on_vehicle(p_vehicle_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp
as $$
  select exists (
    select 1 from public.bookings b
    join public.trips t on t.id=b.trip_id
    where t.vehicle_id=p_vehicle_id and b.user_id=(select auth.uid())
  );
$$;

revoke all on function public.has_own_booking_on_trip(uuid) from public,anon;
revoke all on function public.has_own_booking_on_vehicle(uuid) from public,anon;
grant execute on function public.has_own_booking_on_trip(uuid) to authenticated;
grant execute on function public.has_own_booking_on_vehicle(uuid) to authenticated;

drop policy if exists vehicles_public_active_read on public.vehicles;
create policy vehicles_public_active_read on public.vehicles
  for select to anon,authenticated using (status='active');
drop policy if exists vehicles_customer_booking_read on public.vehicles;
create policy vehicles_customer_booking_read on public.vehicles
  for select to authenticated using (public.has_own_booking_on_vehicle(id));

drop policy if exists trips_public_scheduled_read on public.trips;
create policy trips_public_scheduled_read on public.trips
  for select to anon,authenticated
  using (status='scheduled' and departure_at>now());
drop policy if exists trips_customer_booking_read on public.trips;
create policy trips_customer_booking_read on public.trips
  for select to authenticated using (public.has_own_booking_on_trip(id));
