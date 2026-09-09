begin;
-- Percentage coordinates on the original PDF page. A label is not a doorway.
alter table public.locations add column map_x double precision check(map_x between 0 and 100), add column map_y double precision check(map_y between 0 and 100), add column source_page integer check(source_page>0), add column verification_notes text not null default '';
alter table public.locations add constraint paired_map_coordinates check((map_x is null)=(map_y is null));
alter table public.route_nodes add column map_x double precision check(map_x between 0 and 100), add column map_y double precision check(map_y between 0 and 100);
alter table public.route_nodes add constraint paired_map_coordinates check((map_x is null)=(map_y is null));
alter table public.route_edges add column map_path jsonb, add column source_id text references public.source_records(id);
create index route_edges_source on public.route_edges(source_id);
create index locations_room_normalized on public.locations((regexp_replace(lower(room_code),'[^a-z0-9]','','g'))) where room_code is not null;
create table public.data_reports (
 id uuid primary key default gen_random_uuid(),
 entity_type text not null check(entity_type in('location','missing_location')),
 entity_id text references public.locations(id) on delete set null,
 searched_code text check(length(searched_code)<=100),
 report_type text not null check(report_type in('wrong_location','missing_room','wrong_hours','facility_gone','other','missing_location')),
 message text not null default '' check(length(message)<=1200),
 status text not null default 'pending' check(status in('pending','resolved','rejected')),
 internal_note text not null default '' check(length(internal_note)<=4000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewer_id uuid references public.admin_profiles(user_id) on delete set null
);
create index data_reports_queue on public.data_reports(status,created_at desc);
create index data_reports_entity on public.data_reports(entity_id);
create index data_reports_reviewer on public.data_reports(reviewer_id);
create trigger touch_updated before update on public.data_reports for each row execute function private.touch_updated_at();
create table public.user_feedback (
 id uuid primary key default gen_random_uuid(),
 context text not null check(context in('search','location','route')),
 entity_id text references public.locations(id) on delete set null,
 helpful boolean not null,
 message text not null default '' check(length(message)<=400),
 created_at timestamptz not null default now()
);
create index user_feedback_context on public.user_feedback(context,created_at desc);
create index user_feedback_entity on public.user_feedback(entity_id);
alter table public.data_reports enable row level security;
alter table public.user_feedback enable row level security;
revoke all on public.data_reports,public.user_feedback from anon,authenticated;
grant all on public.data_reports,public.user_feedback to service_role;
grant select,update,delete on public.data_reports to authenticated;
grant select,delete on public.user_feedback to authenticated;
create policy admin_read on public.data_reports for select to authenticated using((select private.is_admin()));
create policy admin_update on public.data_reports for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_delete on public.data_reports for delete to authenticated using((select private.is_admin()));
create policy admin_read on public.user_feedback for select to authenticated using((select private.is_admin()));
create policy admin_delete on public.user_feedback for delete to authenticated using((select private.is_admin()));
commit;
