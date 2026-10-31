-- Profiles table: stores all user taste/profile data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  first_name text,
  last_name text,
  username text,
  selections jsonb not null default '{}',
  entity_ids jsonb not null default '{}',
  entity_images jsonb not null default '{}',
  extras jsonb not null default '{}',
  taste_history jsonb not null default '[]',
  events_attended integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow reading profiles with share consent for group features
create policy "Users can read shared profiles"
  on public.profiles for select
  using ((extras->>'shareConsent')::boolean = true);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
