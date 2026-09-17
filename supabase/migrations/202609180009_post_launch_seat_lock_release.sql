create or replace function public.release_seat_locks(p_trip_id uuid,p_seat_ids uuid[] default null)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_count integer;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 update public.seat_locks
 set status='RELEASED',updated_at=now()
 where trip_id=p_trip_id and user_id=v_uid and status='LOCKED'
   and (p_seat_ids is null or seat_id=any(p_seat_ids));
 get diagnostics v_count=row_count;
 return v_count;
end $$;
revoke execute on function public.release_seat_locks(uuid,uuid[]) from public,anon;
grant execute on function public.release_seat_locks(uuid,uuid[]) to authenticated;

alter function public.create_seat_booking(uuid,uuid[],jsonb) set search_path=public,pg_temp;
