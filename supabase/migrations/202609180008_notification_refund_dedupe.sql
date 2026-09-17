create or replace function public.notify_payment_status_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and new.status is distinct from old.status then
  if new.status='SUCCESS' then
   perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'PAYMENT_SUCCESS','Payment successful','Payment for your booking was successful.');
  elsif new.status='FAILED' then
   perform public.enqueue_in_app_notification(new.user_id,new.booking_id,'PAYMENT_FAILED','Payment failed','Payment for your booking failed. You can retry when payment service is available.');
  end if;
 end if;
 return new;
end $$;
revoke execute on function public.notify_payment_status_change() from public,anon,authenticated;
