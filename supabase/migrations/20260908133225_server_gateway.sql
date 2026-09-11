begin;
create table public.server_credentials(id text primary key,secret_hash text not null check(length(secret_hash)=64),created_at timestamptz not null default now());
alter table public.server_credentials enable row level security;
revoke all on public.server_credentials from anon,authenticated;
grant select,insert,update,delete on public.server_credentials to service_role;
commit;
