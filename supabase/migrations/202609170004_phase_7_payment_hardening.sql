create index if not exists booking_seats_seat_id_idx on public.booking_seats(seat_id);
create index if not exists seat_locks_seat_id_idx on public.seat_locks(seat_id);

drop policy if exists payments_read_own on public.payments;
create policy payments_read_own on public.payments
for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.start_payment(p_booking_id uuid, p_provider text default 'MANUAL')
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_payment_id uuid;
  v_provider text := upper(trim(coalesce(p_provider, '')));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if v_provider <> 'MANUAL' then raise exception 'Payment provider is not enabled'; end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and user_id = v_uid
  for update;

  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status <> 'PENDING' then raise exception 'Booking is not payable'; end if;

  select id into v_payment_id
  from public.payments
  where booking_id = v_booking.id and status = 'PENDING'
  order by created_at desc
  limit 1;

  if v_payment_id is not null then return v_payment_id; end if;

  if exists (
    select 1 from public.payments
    where booking_id = v_booking.id and status in ('PROCESSING','SUCCESS')
  ) then
    raise exception 'Payment already active or completed';
  end if;

  insert into public.payments(booking_id,user_id,provider,status,amount,currency)
  values(v_booking.id,v_uid,v_provider,'PENDING',v_booking.amount,'INR')
  returning id into v_payment_id;

  return v_payment_id;
end $$;

revoke execute on function public.start_payment(uuid,text) from public, anon;
grant execute on function public.start_payment(uuid,text) to authenticated;
