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

-- Only a booking's own fleet can view passenger contact details. This lets
-- the operator call the customer to reconfirm without sharing the lead with
-- other companies; the customer's own read policy remains in place.
drop policy if exists booking_passengers_partner_read on public.booking_passengers;
create policy booking_passengers_partner_read on public.booking_passengers
  for select to authenticated using (exists (
    select 1 from public.bookings b
    join public.trips t on t.id=b.trip_id
    join public.vehicles v on v.id=t.vehicle_id
    join public.organization_memberships om on om.organization_id=v.organization_id
    where b.id=booking_id and om.user_id=(select auth.uid())
      and om.role in ('OWNER','ADMIN','STAFF')
  ));

-- Rejection reasons recorded by a partner should still be visible to the
-- customer who owns the booking, even though the actor is the partner.
drop policy if exists booking_cancellations_customer_read on public.booking_cancellations;
create policy booking_cancellations_customer_read on public.booking_cancellations
  for select to authenticated using (exists (
    select 1 from public.bookings b
    where b.id=booking_id and b.user_id=(select auth.uid())
  ));

-- Closing a booking means the trip has finished. Confirmation before travel
-- remains the earlier partner_decide_booking('CONFIRM') transition.
create or replace function public.partner_complete_booking(p_booking_id uuid)
returns public.booking_status
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_arrival timestamptz;
  v_trip_status public.trip_status;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_booking from public.bookings where id=p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  select t.arrival_at,t.status into v_arrival,v_trip_status
  from public.trips t
  join public.vehicles v on v.id=t.vehicle_id
  join public.organization_memberships om on om.organization_id=v.organization_id
  where t.id=v_booking.trip_id and om.user_id=v_uid and om.role in ('OWNER','ADMIN');
  if not found then raise exception 'Not authorized for this booking'; end if;
  if v_booking.status <> 'CONFIRMED' then raise exception 'Booking must be confirmed first'; end if;
  if v_arrival is null or v_arrival>now() or v_trip_status='cancelled'
  then raise exception 'Trip has not finished'; end if;
  update public.bookings set status='COMPLETED',updated_at=now() where id=p_booking_id;
  return 'COMPLETED';
end $$;
revoke all on function public.partner_complete_booking(uuid) from public,anon;
grant execute on function public.partner_complete_booking(uuid) to authenticated;
