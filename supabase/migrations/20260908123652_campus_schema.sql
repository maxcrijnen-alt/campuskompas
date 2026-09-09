begin;
create schema if not exists private;
create type public.verification as enum ('verified','needs_review','unverified');
create table public.source_records(id text primary key,title text not null,url text not null check(url like 'https://%'),verified_at date not null,verification_status public.verification not null default 'unverified');
create table public.buildings(id text primary key,name text not null,address text not null,updated_at timestamptz not null default now());
create table public.floors(id text primary key,building_id text not null references public.buildings(id),level integer not null,geometry jsonb not null default '[]',verification_status public.verification not null default 'unverified',updated_at timestamptz not null default now(),unique(building_id,level),unique(id,building_id),check(jsonb_typeof(geometry)='array'));
create table public.location_categories(id text primary key,name jsonb not null,icon text not null,aliases text[] not null default '{}');
create table public.route_nodes(id text primary key,building_id text not null references public.buildings(id),floor_id text not null,x double precision not null check(x between 0 and 800),y double precision not null check(y between 0 and 600),node_type text not null,label jsonb not null,accessible boolean not null default false,accessibility_status public.verification not null default 'unverified',verification_status public.verification not null default 'unverified',updated_at timestamptz not null default now(),foreign key(floor_id,building_id) references public.floors(id,building_id));
create table public.route_edges(id text primary key,from_node_id text not null references public.route_nodes(id),to_node_id text not null references public.route_nodes(id),weight double precision not null check(weight>0 and weight<'Infinity'::float),edge_type text not null check(edge_type in ('corridor','stairs','elevator','outdoor')),accessible boolean not null default false,accessibility_status public.verification not null default 'unverified',verification_status public.verification not null default 'unverified',bidirectional boolean not null default true,updated_at timestamptz not null default now(),check(from_node_id<>to_node_id),check(edge_type<>'stairs' or not accessible));
create table public.opening_hours(id text primary key,weekly jsonb not null default '{}',exceptions jsonb not null default '{}',verified_at date not null,verification_status public.verification not null default 'unverified',exceptions_reviewed_through date,source_url text not null check(source_url like 'https://%'),updated_at timestamptz not null default now());
create table public.opening_hour_exceptions(id uuid primary key default gen_random_uuid(),opening_hours_id text not null references public.opening_hours(id) on delete cascade,date date not null,periods jsonb,reason text,unique(opening_hours_id,date));
create table public.locations(id text primary key,name jsonb not null,description jsonb not null,building_id text not null references public.buildings(id),floor_id text not null,category_id text not null references public.location_categories(id),room_code text,aliases text[] not null default '{}',node_id text references public.route_nodes(id),x double precision not null check(x between 0 and 800),y double precision not null check(y between 0 and 600),status text not null default 'pending' check(status in('pending','approved','archived')),verification_status public.verification not null default 'unverified',source_id text not null references public.source_records(id),hours_id text references public.opening_hours(id),updated_at timestamptz not null default now(),foreign key(floor_id,building_id) references public.floors(id,building_id));
create table public.rooms(id text primary key,code text not null,location_id text not null references public.locations(id) on delete cascade,public boolean not null default true,unique(location_id));
create table public.first_year_tips(id text primary key,title jsonb not null,body jsonb not null,icon text not null,published boolean not null default false,updated_at timestamptz not null default now());
create table public.qr_locations(code text primary key,route_node_id text not null references public.route_nodes(id),label text not null,active boolean not null default false);
create table public.hidden_gems(id uuid primary key default gen_random_uuid(),slug text not null unique default gen_random_uuid()::text,title text not null check(length(title) between 5 and 90),description text not null check(length(description) between 15 and 1200),category text not null check(category in('quiet','study','chill','food','coffee','power','view','group','other')),location_id text not null references public.locations(id),status text not null default 'pending' check(status in('pending','approved','rejected','archived')),featured boolean not null default false,photo_path text,likes integer not null default 0 check(likes>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.hidden_gem_votes(gem_id uuid not null references public.hidden_gems(id) on delete cascade,device_hash text not null check(length(device_hash)=64),created_at timestamptz not null default now(),primary key(gem_id,device_hash));
create table public.admin_profiles(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create table private.rate_limits(key text primary key,window_start timestamptz not null default now(),count integer not null default 0);
alter table private.rate_limits enable row level security;

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.admin_profiles where user_id=auth.uid()); $$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
alter table public.admin_profiles enable row level security;
grant select on public.admin_profiles to authenticated;
create policy admin_self on public.admin_profiles for select to authenticated using(user_id=(select auth.uid()));

do $$ declare t text;begin
 foreach t in array array['source_records','buildings','floors','location_categories','route_nodes','route_edges','opening_hours','opening_hour_exceptions','locations','rooms','first_year_tips','qr_locations','hidden_gems','hidden_gem_votes'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy admin_all on public.%I for all to authenticated using((select private.is_admin())) with check((select private.is_admin()))',t);
 end loop;
 foreach t in array array['source_records','buildings','floors','location_categories','route_nodes','route_edges','opening_hours','opening_hour_exceptions'] loop
 execute format('grant select on public.%I to anon',t);
 execute format('create policy public_read on public.%I for select to anon,authenticated using(true)',t);
 end loop;
end $$;
grant select on public.locations,public.rooms,public.first_year_tips,public.qr_locations,public.hidden_gems to anon;
create policy approved_locations on public.locations for select to anon,authenticated using(status='approved');
create policy public_rooms on public.rooms for select to anon,authenticated using(public and exists(select 1 from public.locations l where l.id=location_id and l.status='approved'));
create policy published_tips on public.first_year_tips for select to anon,authenticated using(published);
create policy active_qr on public.qr_locations for select to anon,authenticated using(active);
create policy approved_gems on public.hidden_gems for select to anon,authenticated using(status='approved');

create index locations_floor on public.locations(floor_id);
create index locations_category on public.locations(category_id);
create index nodes_floor on public.route_nodes(floor_id);
create index edges_from on public.route_edges(from_node_id);
create index edges_to on public.route_edges(to_node_id);
create index gems_status on public.hidden_gems(status,created_at desc);
create index gems_location on public.hidden_gems(location_id);
create index qr_node on public.qr_locations(route_node_id);
create index locations_node on public.locations(node_id);
create index locations_source on public.locations(source_id);
create index locations_hours on public.locations(hours_id);

create function public.consume_limit(p_key text,p_max integer,p_window integer) returns void language plpgsql security invoker set search_path='' as $$
declare c integer;
begin
 if length(p_key)>100 or p_max<1 or p_window<1 then raise exception 'INVALID_INPUT';end if;
 insert into private.rate_limits as r(key,window_start,count) values(p_key,now(),1)
 on conflict(key) do update set count=case when r.window_start<now()-make_interval(secs=>p_window) then 1 else r.count+1 end,window_start=case when r.window_start<now()-make_interval(secs=>p_window) then now() else r.window_start end returning count into c;
 if c>p_max then raise exception 'RATE_LIMIT';end if;
 delete from private.rate_limits where window_start<now()-interval '2 days';
end $$;
grant usage on schema private to service_role;
grant all on private.rate_limits to service_role;
revoke all on function public.consume_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_limit(text,integer,integer) to service_role;
create function public.vote_gem(p_gem uuid,p_device text) returns integer language plpgsql security invoker set search_path='' as $$
declare inserted integer; total integer;
begin
 if length(p_device)<>64 then raise exception 'INVALID_INPUT';end if;
 perform public.consume_limit(p_device||':vote',60,3600);
 perform 1 from public.hidden_gems where id=p_gem and status='approved' for update;
 if not found then raise exception 'INVALID_INPUT';end if;
 insert into public.hidden_gem_votes(gem_id,device_hash) values(p_gem,p_device) on conflict do nothing;
 get diagnostics inserted=row_count;
 update public.hidden_gems set likes=likes+inserted where id=p_gem returning likes into total;
 return total;
end $$;
revoke all on function public.vote_gem(uuid,text) from public,anon,authenticated;
grant execute on function public.vote_gem(uuid,text) to service_role;
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end $$;
do $$ declare t text;begin foreach t in array array['buildings','floors','route_nodes','route_edges','opening_hours','locations','first_year_tips','hidden_gems'] loop execute format('create trigger touch_updated before update on public.%I for each row execute function private.touch_updated_at()',t);end loop;end $$;

-- Photos stay private. No anon or authenticated storage policies; the bounded server
-- handler serves approved photos and checks admin membership for pending photos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('gem-photos','gem-photos',false,3145728,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
commit;
