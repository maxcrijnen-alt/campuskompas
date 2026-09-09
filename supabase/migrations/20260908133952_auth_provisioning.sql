begin;
create table private.registration_permits(email text primary key,expires_at timestamptz not null default now()+interval '5 minutes');
alter table private.registration_permits enable row level security;
revoke all on private.registration_permits from public,anon,authenticated;
create or replace function private.guard_admin_registration() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from private.registration_permits where lower(email)=lower(new.email) and expires_at>now();
 if not found then raise exception 'CampusKompas supports provisioned administrators only';end if;
 return new;
end $$;
revoke all on function private.guard_admin_registration() from public,anon,authenticated;
commit;
