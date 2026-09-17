create type public.payment_status as enum ('PENDING','PROCESSING','SUCCESS','FAILED','CANCELLED','REFUND_PENDING','REFUNDED');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null,
  provider_order_id text,
  provider_payment_id text,
  status public.payment_status not null default 'PENDING',
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR' check (char_length(currency)=3),
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(provider, provider_order_id),
  unique(provider, provider_payment_id)
);
create index payments_booking_id_idx on public.payments(booking_id);
create index payments_user_id_idx on public.payments(user_id);
create index payments_status_idx on public.payments(status);

alter table public.payments enable row level security;
create policy payments_read_own on public.payments for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

create table public.payment_events (
  id bigint generated always as identity primary key,
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);
create index payment_events_payment_id_idx on public.payment_events(payment_id);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

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
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_booking from public.bookings where id=p_booking_id and user_id=v_uid for update;
  if not found then raise exception 'Booking not found'; end if;
  if v_booking.status <> 'PENDING' then raise exception 'Booking is not payable'; end if;
  if exists(select 1 from public.payments where booking_id=v_booking.id and status in ('PROCESSING','SUCCESS')) then raise exception 'Payment already active or completed'; end if;
  insert into public.payments(booking_id,user_id,provider,status,amount,currency)
  values(v_booking.id,v_uid,upper(trim(p_provider)),'PENDING',v_booking.amount,'INR') returning id into v_payment_id;
  return v_payment_id;
end $$;
revoke execute on function public.start_payment(uuid,text) from public, anon;
grant execute on function public.start_payment(uuid,text) to authenticated;
