-- The partner booking action is atomic and restricted to fleet owners/admins.
-- Paid bookings need a separate provider-backed refund flow.
create or replace function public.partner_decide_booking(
  p_booking_id uuid, p_decision text, p_reason text default null
)
returns public.booking_status
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_departure timestamptz;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('CONFIRM','REJECT') then raise exception 'Invalid decision'; end if;
  if p_reason is not null and char_length(p_reason) > 500 then raise exception 'Reason too long'; end if;

  select b.* into v_booking from public.bookings b where b.id=p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;
  select t.departure_at into v_departure
  from public.trips t
  join public.vehicles v on v.id=t.vehicle_id
  join public.organization_memberships om on om.organization_id=v.organization_id
  where t.id=v_booking.trip_id and om.user_id=v_uid and om.role in ('OWNER','ADMIN');
  if not found then raise exception 'Not authorized for this booking'; end if;
  if v_booking.status <> 'PENDING' then raise exception 'Booking is no longer pending'; end if;
  if v_departure <= now() then raise exception 'Trip has already departed'; end if;

  if p_decision='CONFIRM' then
    -- Unpaid bookings may follow the operator's offline payment terms.
    if exists(select 1 from public.payments
              where booking_id=p_booking_id and status in ('PENDING','PROCESSING','REFUND_PENDING'))
    then raise exception 'Payment is still being processed'; end if;
    update public.bookings set status='CONFIRMED',updated_at=now() where id=p_booking_id;
    return 'CONFIRMED';
  end if;

  -- Never release inventory while a payment may still settle.
  if exists(select 1 from public.payments
            where booking_id=p_booking_id and status in ('PENDING','PROCESSING','SUCCESS','REFUND_PENDING','REFUNDED'))
  then raise exception 'Payment exists; this booking needs payment or refund review'; end if;
  update public.bookings set status='CANCELLED',updated_at=now() where id=p_booking_id;
  update public.booking_seats set released_at=now()
    where booking_id=p_booking_id and released_at is null;
  update public.seat_locks sl set status='RELEASED',updated_at=now()
    where sl.trip_id=v_booking.trip_id and sl.user_id=v_booking.user_id
      and sl.status='LOCKED'
      and exists(select 1 from public.booking_seats bs
                 where bs.booking_id=p_booking_id and bs.seat_id=sl.seat_id);
  insert into public.booking_cancellations(booking_id,user_id,reason,refund_amount)
  values(p_booking_id,v_uid,nullif(btrim(p_reason),''),0);
  return 'CANCELLED';
end $$;

revoke all on function public.partner_decide_booking(uuid,text,text) from public,anon;
grant execute on function public.partner_decide_booking(uuid,text,text) to authenticated;

-- Status transitions use guarded functions, not direct table UPDATE.
drop policy if exists "admins can update own fleet bookings" on public.bookings;
revoke update on public.bookings from authenticated;
