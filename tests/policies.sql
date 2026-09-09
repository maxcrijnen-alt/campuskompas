begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ declare changed integer;begin
 update public.locations set status='archived' where id='library';get diagnostics changed=row_count;if changed<>0 then raise exception 'Non-admin modified location';end if;
 update public.route_nodes set accessible=true where id='R8-0-entry';get diagnostics changed=row_count;if changed<>0 then raise exception 'Non-admin modified graph';end if;
 if exists(select 1 from public.admin_profiles) then raise exception 'Non-admin read admin profiles';end if;
end $$;
rollback;
