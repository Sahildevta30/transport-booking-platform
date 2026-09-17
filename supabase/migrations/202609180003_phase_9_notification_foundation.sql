create type public.notification_channel as enum ('IN_APP','EMAIL','SMS','WHATSAPP');
create type public.notification_status as enum ('PENDING','PROCESSING','SENT','FAILED','CANCELLED');

create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 booking_id uuid references public.bookings(id) on delete set null,
 channel public.notification_channel not null default 'IN_APP',
 event_type text not null check (event_type in ('BOOKING_CREATED','BOOKING_CONFIRMED','BOOKING_CANCELLED','PAYMENT_SUCCESS','PAYMENT_FAILED','REFUND_PENDING','REFUND_COMPLETED','TRIP_REMINDER','TRIP_CANCELLED')),
 title text not null check (char_length(title) between 1 and 160),
 message text not null check (char_length(message) between 1 and 2000),
 status public.notification_status not null default 'PENDING',
 provider text,
 provider_message_id text,
 failure_message text,
 read_at timestamptz,
 sent_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index notifications_booking_id_idx on public.notifications(booking_id);
create index notifications_pending_idx on public.notifications(status,created_at) where status in ('PENDING','PROCESSING');
alter table public.notifications enable row level security;
create policy notifications_read_own on public.notifications for select to authenticated using(user_id=(select auth.uid()));
revoke insert,update,delete on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 update public.notifications set read_at=coalesce(read_at,now()),updated_at=now() where id=p_notification_id and user_id=auth.uid();
 if not found then raise exception 'Notification not found'; end if;
end $$;
revoke execute on function public.mark_notification_read(uuid) from public,anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
