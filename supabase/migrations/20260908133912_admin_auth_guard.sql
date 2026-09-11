begin;
-- GoTrue sets app_metadata through the privileged admin API only. Public sign-up
-- cannot set this flag. Actual admin authorization still requires admin_profiles.
create function private.guard_admin_registration() returns trigger language plpgsql set search_path='' as $$
begin
 if coalesce(new.raw_app_meta_data->>'campus_admin_provisioned','false')<>'true' then raise exception 'CampusKompas supports provisioned administrators only'; end if;
 return new;
end $$;
create trigger campus_admin_registration before insert on auth.users for each row execute function private.guard_admin_registration();
revoke all on function private.guard_admin_registration() from public,anon,authenticated;
commit;
