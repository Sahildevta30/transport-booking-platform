alter table public.booking_seats add column if not exists released_at timestamptz;
alter table public.booking_seats drop constraint if exists booking_seats_trip_id_seat_id_key;
create unique index if not exists booking_seats_active_trip_seat_unique on public.booking_seats(trip_id,seat_id) where released_at is null;

create table if not exists public.booking_cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  reason text,
  refund_amount numeric(12,2) not null default 0 check(refund_amount>=0),
  created_at timestamptz not null default now(),
  unique(booking_id)
);
create index if not exists booking_cancellations_user_id_idx on public.booking_cancellations(user_id);
alter table public.booking_cancellations enable row level security;
create policy booking_cancellations_read_own on public.booking_cancellations for select to authenticated using(user_id=(select auth.uid()));
revoke insert,update,delete on public.booking_cancellations from anon,authenticated;
grant select on public.booking_cancellations to authenticated;

create or replace function public.cancel_booking(p_booking_id uuid,p_reason text default null)
returns public.booking_status language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid();v_booking public.bookings%rowtype;v_paid numeric(12,2):=0;v_new_status public.booking_status;
begin
 if v_uid is null then raise exception 'Authentication required';end if;
 select * into v_booking from public.bookings where id=p_booking_id and user_id=v_uid for update;
 if not found then raise exception 'Booking not found';end if;
 if v_booking.status not in ('PENDING','CONFIRMED') then raise exception 'Booking cannot be cancelled';end if;
 if exists(select 1 from public.trips where id=v_booking.trip_id and departure_at<=now()) then raise exception 'Trip has already departed';end if;
 select coalesce(sum(amount),0) into v_paid from public.payments where booking_id=v_booking.id and status='SUCCESS';
 v_new_status:=case when v_paid>0 then 'REFUND_PENDING'::public.booking_status else 'CANCELLED'::public.booking_status end;
 update public.bookings set status=v_new_status,updated_at=now() where id=v_booking.id;
 update public.booking_seats set released_at=now() where booking_id=v_booking.id and released_at is null;
 update public.seat_locks set status='RELEASED',updated_at=now() where trip_id=v_booking.trip_id and user_id=v_uid and status='LOCKED';
 if v_paid>0 then update public.payments set status='REFUND_PENDING',updated_at=now() where booking_id=v_booking.id and status='SUCCESS';end if;
 insert into public.booking_cancellations(booking_id,user_id,reason,refund_amount) values(v_booking.id,v_uid,nullif(trim(p_reason),''),least(v_paid,v_booking.amount));
 return v_new_status;
end $$;
revoke execute on function public.cancel_booking(uuid,text) from public,anon;
grant execute on function public.cancel_booking(uuid,text) to authenticated;
