-- Add global location, field track, and work-arrangement fields.
-- Safe to run on a database that already applied scripts/001_create_schema.sql.

alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists city text;

alter table public.student_profiles add column if not exists field_track text;
alter table public.student_profiles add column if not exists open_to_remote boolean default true;
alter table public.student_profiles add column if not exists willing_to_relocate boolean default false;

alter table public.opportunities add column if not exists field_track text;
alter table public.opportunities add column if not exists country text;
alter table public.opportunities add column if not exists city text;
alter table public.opportunities add column if not exists work_mode text default 'onsite';
alter table public.opportunities add column if not exists open_to_international boolean default true;
alter table public.opportunities add column if not exists visa_support text default 'case_by_case';

alter table public.student_profiles drop constraint if exists student_profiles_field_track_check;
alter table public.student_profiles
  add constraint student_profiles_field_track_check
  check (field_track is null or field_track in ('medical', 'technology', 'both'));

alter table public.opportunities drop constraint if exists opportunities_field_track_check;
alter table public.opportunities
  add constraint opportunities_field_track_check
  check (field_track is null or field_track in ('medical', 'technology', 'both'));

alter table public.opportunities drop constraint if exists opportunities_work_mode_check;
alter table public.opportunities
  add constraint opportunities_work_mode_check
  check (work_mode is null or work_mode in ('remote', 'hybrid', 'onsite'));

alter table public.opportunities drop constraint if exists opportunities_visa_support_check;
alter table public.opportunities
  add constraint opportunities_visa_support_check
  check (visa_support is null or visa_support in ('yes', 'no', 'case_by_case'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, university)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    nullif(new.raw_user_meta_data ->> 'university', '')
  )
  on conflict (id) do nothing;

  if coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'student' then
    insert into public.student_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  else
    insert into public.professor_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
