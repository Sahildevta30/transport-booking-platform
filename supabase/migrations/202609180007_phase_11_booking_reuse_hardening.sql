create or replace function public.acquire_seat_locks(p_trip_id uuid,p_seat_ids uuid[],p_ttl_seconds integer default 600)
returns setof public.seat_locks language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_vehicle uuid;v_seat uuid;
begin
 if v_user is null then raise exception 'authentication required';end if;
 if p_ttl_seconds<60 or p_ttl_seconds>900 then raise exception 'invalid lock ttl';end if;
 if coalesce(array_length(p_seat_ids,1),0)<1 or array_length(p_seat_ids,1)>50 then raise exception 'invalid seat selection';end if;
 if (select count(distinct x) from unnest(p_seat_ids)x)<>array_length(p_seat_ids,1) then raise exception 'duplicate seats';end if;
 select vehicle_id into v_vehicle from public.trips where id=p_trip_id and status='scheduled' and departure_at>now() for update;
 if v_vehicle is null then raise exception 'trip unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_trip_id::text,0));
 update public.seat_locks set status='RELEASED',updated_at=now() where trip_id=p_trip_id and status='LOCKED' and expires_at<=now();
 if exists(select 1 from public.bookings where trip_id=p_trip_id and booking_mode='FULL_VEHICLE_BOOKING' and status in ('PENDING','CONFIRMED')) then raise exception 'vehicle fully reserved';end if;
 if exists(select 1 from public.booking_seats bs where bs.trip_id=p_trip_id and bs.seat_id=any(p_seat_ids) and bs.released_at is null) then raise exception 'seat already booked';end if;
 if exists(select 1 from public.seat_locks sl where sl.trip_id=p_trip_id and sl.seat_id=any(p_seat_ids) and sl.status='LOCKED' and sl.expires_at>now() and sl.user_id<>v_user) then raise exception 'seat temporarily locked';end if;
 foreach v_seat in array p_seat_ids loop
  if not exists(select 1 from public.vehicle_seats s where s.id=v_seat and s.vehicle_id=v_vehicle) then raise exception 'invalid seat for trip';end if;
  update public.seat_locks set expires_at=now()+make_interval(secs=>p_ttl_seconds),updated_at=now() where trip_id=p_trip_id and seat_id=v_seat and status='LOCKED' and user_id=v_user;
  if not found then insert into public.seat_locks(trip_id,seat_id,user_id,expires_at) values(p_trip_id,v_seat,v_user,now()+make_interval(secs=>p_ttl_seconds));end if;
 end loop;
 return query select * from public.seat_locks where trip_id=p_trip_id and seat_id=any(p_seat_ids) and user_id=v_user and status='LOCKED';
end $$;
create or replace function public.create_full_vehicle_booking(p_trip_id uuid,p_passengers jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_booking uuid;v_price numeric;v_count integer;
begin
 if v_user is null then raise exception 'authentication required';end if;if jsonb_typeof(p_passengers)<>'array' then raise exception 'invalid passengers';end if;
 v_count:=jsonb_array_length(p_passengers);if v_count<1 or v_count>50 then raise exception 'invalid passengers';end if;perform pg_advisory_xact_lock(hashtextextended(p_trip_id::text,0));
 select base_price into v_price from public.trips where id=p_trip_id and status='scheduled' and departure_at>now() for update;if v_price is null then raise exception 'trip unavailable';end if;
 update public.seat_locks set status='RELEASED',updated_at=now() where trip_id=p_trip_id and status='LOCKED' and expires_at<=now();
 if exists(select 1 from public.seat_locks where trip_id=p_trip_id and status='LOCKED' and expires_at>now()) or exists(select 1 from public.booking_seats where trip_id=p_trip_id and released_at is null) then raise exception 'vehicle has seat reservations';end if;
 insert into public.bookings(user_id,trip_id,booking_mode,passenger_count,amount) values(v_user,p_trip_id,'FULL_VEHICLE_BOOKING',v_count,v_price) returning id into v_booking;
 insert into public.booking_passengers(booking_id,full_name,phone) select v_booking,btrim(value->>'fullName'),btrim(value->>'phone') from jsonb_array_elements(p_passengers) where char_length(btrim(coalesce(value->>'fullName',''))) between 2 and 120 and char_length(btrim(coalesce(value->>'phone',''))) between 7 and 20;
 if(select count(*) from public.booking_passengers where booking_id=v_booking)<>v_count then raise exception 'invalid passenger';end if;return v_booking;end $$;
create or replace function public.cancel_booking(p_booking_id uuid,p_reason text default null)
returns public.booking_status language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid();v_booking public.bookings%rowtype;v_paid numeric(12,2):=0;v_new_status public.booking_status;
begin
 if v_uid is null then raise exception 'Authentication required';end if;select * into v_booking from public.bookings where id=p_booking_id and user_id=v_uid for update;if not found then raise exception 'Booking not found';end if;
 if v_booking.status not in ('PENDING','CONFIRMED') then raise exception 'Booking cannot be cancelled';end if;if exists(select 1 from public.trips where id=v_booking.trip_id and departure_at<=now()) then raise exception 'Trip has already departed';end if;
 select coalesce(sum(amount),0) into v_paid from public.payments where booking_id=v_booking.id and status='SUCCESS';v_new_status:=case when v_paid>0 then 'REFUND_PENDING'::public.booking_status else 'CANCELLED'::public.booking_status end;
 update public.bookings set status=v_new_status,updated_at=now() where id=v_booking.id;update public.booking_seats set released_at=now() where booking_id=v_booking.id and released_at is null;
 update public.seat_locks sl set status='RELEASED',updated_at=now() where sl.trip_id=v_booking.trip_id and sl.user_id=v_uid and sl.status='LOCKED' and exists(select 1 from public.booking_seats bs where bs.booking_id=v_booking.id and bs.seat_id=sl.seat_id);
 if v_paid>0 then update public.payments set status='REFUND_PENDING',updated_at=now() where booking_id=v_booking.id and status='SUCCESS';end if;
 insert into public.booking_cancellations(booking_id,user_id,reason,refund_amount) values(v_booking.id,v_uid,nullif(trim(p_reason),''),least(v_paid,v_booking.amount));return v_new_status;end $$;
revoke execute on function public.acquire_seat_locks(uuid,uuid[],integer) from public,anon;grant execute on function public.acquire_seat_locks(uuid,uuid[],integer) to authenticated;
revoke execute on function public.create_full_vehicle_booking(uuid,jsonb) from public,anon;grant execute on function public.create_full_vehicle_booking(uuid,jsonb) to authenticated;
revoke execute on function public.cancel_booking(uuid,text) from public,anon;grant execute on function public.cancel_booking(uuid,text) to authenticated;
