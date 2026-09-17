-- Phase 6 audit hardening: booking mutation RPCs must never be callable anonymously.
revoke execute on function public.acquire_seat_locks(uuid, uuid[], integer) from public, anon;
revoke execute on function public.create_seat_booking(uuid, uuid[], jsonb) from public, anon;
revoke execute on function public.create_full_vehicle_booking(uuid, jsonb) from public, anon;

grant execute on function public.acquire_seat_locks(uuid, uuid[], integer) to authenticated;
grant execute on function public.create_seat_booking(uuid, uuid[], jsonb) to authenticated;
grant execute on function public.create_full_vehicle_booking(uuid, jsonb) to authenticated;
