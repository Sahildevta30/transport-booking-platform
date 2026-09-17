drop policy if exists bookings_own_read on public.bookings;
create policy bookings_own_read on public.bookings for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists booking_passengers_own_read on public.booking_passengers;
create policy booking_passengers_own_read on public.booking_passengers for select to authenticated using (exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())));

drop policy if exists seat_locks_own_read on public.seat_locks;
create policy seat_locks_own_read on public.seat_locks for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists booking_seats_own_read on public.booking_seats;
create policy booking_seats_own_read on public.booking_seats for select to authenticated using (exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())));
