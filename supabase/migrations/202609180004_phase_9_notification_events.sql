create or replace function public.enqueue_in_app_notification(p_user_id uuid,p_booking_id uuid,p_event_type text,p_title text,p_message text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 insert into public.notifications(user_id,booking_id,channel,event_type,title,message,status,sent_at)
 values(p_user_id,p_booking_id,'IN_APP',p_event_type,p_title,p_message,'SENT',now()) returning id into v_id;
 return v_id;
end $$;
revoke execute on function public.enqueue_in_app_notification(uuid,uuid,text,text,text) from public,anon,authenticated;

create or replace function public.notify_booking_status_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' then
  perform public.enqueue_in_app_notification(new.user_id,new.id,'BOOKING_CREATED','Booking created','Your booking request has been created.');
 elsif new.status is distinct from old.status then
  if new.status='CONFIRMED' then perform public.enqueue_in_app_notification(new.user_id,new.id,'BOOKING_CONFIRMED','Booking confirmed','Your booking has been confirmed.');
  elsif new.status='CANCELLED' then perform public.enqueue_in_app_notification(new.user_id,new.id,'BOOKING_CANCELLED','Booking cancelled','Your booking has been cancelled.');
  elsif new.status='REFUND_PENDING' then perform public.enqueue_in_app_notification(new.user_id,new.id,'REFUND_PENDING','Refund pending','Your booking is cancelled and the refund is pending processing.');
  elsif new.status='REFUNDED' then perform public.enqueue_in_app_notification(new.user_id,new.id,'REFUND_COMPLETED','Refund completed','The refund for your booking has been marked completed.');
  end if;
 end if;
 return new;
end $$;
drop trigger if exists bookings_notification_trigger on public.bookings;
create trigger bookings_notification_trigger after insert or update of status on public.bookings for each row execute function public.notify_booking_status_change();

create or replace function public.notify_payment_status_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and new.status is distinct from old.status then
  if new.status='SUCCESS' then perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'PAYMENT_SUCCESS','Payment successful','Payment for your booking was successful.');
  elsif new.status='FAILED' then perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'PAYMENT_FAILED','Payment failed','Payment for your booking failed. You can retry when payment service is available.');
  elsif new.status='REFUND_PENDING' and old.status<>'REFUND_PENDING' then perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'REFUND_PENDING','Refund pending','Your payment refund is pending processing.');
  elsif new.status='REFUNDED' then perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'REFUND_COMPLETED','Refund completed','Your payment refund has been marked completed.');
  end if;
 end if;
 return new;
end $$;
drop trigger if exists payments_notification_trigger on public.payments;
create trigger payments_notification_trigger after update of status on public.payments for each row execute function public.notify_payment_status_change();
