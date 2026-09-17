create or replace function public.trip_seat_availability(p_trip_id uuid)
returns table(seat_id uuid, availability text)
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select vs.id,
    case
      when exists(select 1 from public.booking_seats bs where bs.trip_id=p_trip_id and bs.seat_id=vs.id and bs.released_at is null) then 'BOOKED'
      when exists(select 1 from public.seat_locks sl where sl.trip_id=p_trip_id and sl.seat_id=vs.id and sl.status='LOCKED' and sl.expires_at>now() and sl.user_id<>auth.uid()) then 'LOCKED'
      else 'AVAILABLE'
    end
  from public.vehicle_seats vs
  join public.trips t on t.id=p_trip_id and t.vehicle_id=vs.vehicle_id
  where auth.uid() is not null;
$$;
revoke execute on function public.trip_seat_availability(uuid) from public,anon;
grant execute on function public.trip_seat_availability(uuid) to authenticated;
