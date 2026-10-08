-- ScholarSync Database Schema
-- Creates all necessary tables for the research opportunity matching platform

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text check (role in ('student', 'professor')) default 'student',
  university text,
  department text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Student details table
create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  major text,
  graduation_year integer,
  gpa numeric(3,2),
  skills text[] default '{}',
  interests text[] default '{}',
  resume_url text,
  linkedin_url text,
  github_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Professor details table
create table if not exists public.professor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  title text,
  research_areas text[] default '{}',
  lab_name text,
  website_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Research opportunities table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  requirements text,
  skills_needed text[] default '{}',
  research_areas text[] default '{}',
  duration text,
  compensation text,
  positions_available integer default 1,
  application_deadline timestamp with time zone,
  status text check (status in ('open', 'closed', 'filled')) default 'open',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  cover_letter text,
  status text check (status in ('pending', 'reviewed', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(opportunity_id, student_id)
);

-- Saved opportunities table (bookmarks)
create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, opportunity_id)
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.professor_profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.saved_opportunities enable row level security;

-- Profiles policies
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Student profiles policies
create policy "Users can view all student profiles" on public.student_profiles for select using (true);
create policy "Users can update own student profile" on public.student_profiles for update using (auth.uid() = user_id);
create policy "Users can insert own student profile" on public.student_profiles for insert with check (auth.uid() = user_id);
create policy "Users can delete own student profile" on public.student_profiles for delete using (auth.uid() = user_id);

-- Professor profiles policies
create policy "Users can view all professor profiles" on public.professor_profiles for select using (true);
create policy "Users can update own professor profile" on public.professor_profiles for update using (auth.uid() = user_id);
create policy "Users can insert own professor profile" on public.professor_profiles for insert with check (auth.uid() = user_id);
create policy "Users can delete own professor profile" on public.professor_profiles for delete using (auth.uid() = user_id);

-- Opportunities policies
create policy "Anyone can view open opportunities" on public.opportunities for select using (status = 'open' or professor_id = auth.uid());
create policy "Professors can create opportunities" on public.opportunities for insert with check (auth.uid() = professor_id);
create policy "Professors can update own opportunities" on public.opportunities for update using (auth.uid() = professor_id);
create policy "Professors can delete own opportunities" on public.opportunities for delete using (auth.uid() = professor_id);

-- Applications policies
create policy "Students can view own applications" on public.applications for select using (auth.uid() = student_id);
create policy "Professors can view applications to their opportunities" on public.applications for select using (
  exists (select 1 from public.opportunities where id = opportunity_id and professor_id = auth.uid())
);
create policy "Students can create applications" on public.applications for insert with check (auth.uid() = student_id);
create policy "Students can update own applications" on public.applications for update using (auth.uid() = student_id);
create policy "Professors can update applications to their opportunities" on public.applications for update using (
  exists (select 1 from public.opportunities where id = opportunity_id and professor_id = auth.uid())
);

-- Saved opportunities policies
create policy "Users can view own saved opportunities" on public.saved_opportunities for select using (auth.uid() = user_id);
create policy "Users can save opportunities" on public.saved_opportunities for insert with check (auth.uid() = user_id);
create policy "Users can unsave opportunities" on public.saved_opportunities for delete using (auth.uid() = user_id);

-- Create function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  
  -- Auto-create student or professor profile based on role
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

-- Create trigger to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_student_profiles_updated_at before update on public.student_profiles for each row execute function public.update_updated_at_column();
create trigger update_professor_profiles_updated_at before update on public.professor_profiles for each row execute function public.update_updated_at_column();
create trigger update_opportunities_updated_at before update on public.opportunities for each row execute function public.update_updated_at_column();
create trigger update_applications_updated_at before update on public.applications for each row execute function public.update_updated_at_column();
