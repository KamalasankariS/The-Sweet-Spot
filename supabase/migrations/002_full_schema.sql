-- ============================================================
-- THE SWEET SPOT — Full Database Schema
-- ============================================================

-- ============================================================
-- 1. GROUPS (event planning groups)
-- ============================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode text not null default 'social' check (mode in ('social', 'corporate')),
  occasion text,
  location text,
  invite_code text unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  cover_image text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- ============================================================
-- 2. GROUP MEMBERS (who belongs to which group)
-- ============================================================
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Members can see their own groups
create policy "Members can read own groups"
  on public.groups for select
  using (id in (select group_id from public.group_members where user_id = auth.uid()));

-- Anyone can read a group by invite code (for joining)
create policy "Anyone can read group by invite code"
  on public.groups for select
  using (invite_code is not null);

-- Owners can update their group
create policy "Owners can update group"
  on public.groups for update
  using (created_by = auth.uid());

-- Authenticated users can create groups
create policy "Auth users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- Group members policies
create policy "Members can read group members"
  on public.group_members for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

create policy "Users can join groups"
  on public.group_members for insert
  with check (auth.uid() = user_id);

create policy "Owners can manage members"
  on public.group_members for delete
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid() and role in ('owner', 'admin'))
    or user_id = auth.uid()
  );

-- ============================================================
-- 3. EVENTS (planned events with itineraries)
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  event_type text, -- 'date-night', 'game-night', etc.
  location text,
  date date,
  time_slot text, -- 'evening', 'afternoon', etc.
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  itinerary jsonb not null default '[]', -- array of stops/activities
  vibe_source text check (vibe_source in ('profile', 'fresh')),
  vibe_selections jsonb, -- fresh quiz selections if taken
  budget text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Event creators can manage"
  on public.events for all
  using (created_by = auth.uid());

create policy "Group members can read events"
  on public.events for select
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
    or created_by = auth.uid()
  );

-- ============================================================
-- 4. EVENT PARTICIPANTS (who attended / is attending)
-- ============================================================
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rsvp text not null default 'pending' check (rsvp in ('pending', 'going', 'maybe', 'declined')),
  attended boolean default false,
  rating integer check (rating between 1 and 5),
  feedback text,
  joined_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_participants enable row level security;

create policy "Participants can read own events"
  on public.event_participants for select
  using (user_id = auth.uid() or event_id in (
    select e.id from public.events e
    join public.group_members gm on gm.group_id = e.group_id
    where gm.user_id = auth.uid()
  ));

create policy "Users can manage own participation"
  on public.event_participants for all
  using (user_id = auth.uid());

-- ============================================================
-- 5. CONVERSATIONS (group chats + DMs)
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('group', 'dm', 'event')),
  group_id uuid references public.groups(id) on delete cascade, -- null for DMs
  event_id uuid references public.events(id) on delete cascade, -- event-specific chat
  name text, -- null for DMs, group name for group chats
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

-- ============================================================
-- 6. CONVERSATION PARTICIPANTS
-- ============================================================
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz default now(),
  muted boolean default false,
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

create policy "Participants can read own conversations"
  on public.conversations for select
  using (id in (select conversation_id from public.conversation_participants where user_id = auth.uid()));

create policy "Users can read own conversation membership"
  on public.conversation_participants for select
  using (user_id = auth.uid() or conversation_id in (
    select conversation_id from public.conversation_participants where user_id = auth.uid()
  ));

create policy "Users can update own conversation settings"
  on public.conversation_participants for update
  using (user_id = auth.uid());

-- ============================================================
-- 7. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text,
  type text not null default 'text' check (type in ('text', 'image', 'video', 'system', 'recommendation', 'itinerary')),
  metadata jsonb default '{}', -- for recommendation cards, itinerary shares, etc.
  reply_to uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Conversation members can read messages"
  on public.messages for select
  using (conversation_id in (
    select conversation_id from public.conversation_participants where user_id = auth.uid()
  ));

create policy "Users can send messages to own conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select conversation_id from public.conversation_participants where user_id = auth.uid()
    )
  );

create policy "Users can edit own messages"
  on public.messages for update
  using (sender_id = auth.uid());

-- Index for fast message loading
create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at desc);

-- ============================================================
-- 8. MEDIA (photos/videos — shared in groups, DMs, photobooth)
-- ============================================================
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  type text not null check (type in ('photo', 'video', 'gif')),
  url text not null, -- Supabase Storage URL
  thumbnail_url text,
  caption text,
  is_photobooth boolean default false, -- photobooth memory flag
  metadata jsonb default '{}', -- exif, dimensions, duration, filters applied
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "Uploader can manage own media"
  on public.media for all
  using (uploaded_by = auth.uid());

create policy "Group members can view group media"
  on public.media for select
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
    or event_id in (select event_id from public.event_participants where user_id = auth.uid())
    or conversation_id in (select conversation_id from public.conversation_participants where user_id = auth.uid())
  );

-- Index for fast media gallery loading
create index if not exists idx_media_event on public.media (event_id, created_at desc);
create index if not exists idx_media_photobooth on public.media (uploaded_by, is_photobooth, created_at desc);

-- ============================================================
-- 9. PHOTOBOOTH COLLECTIONS (memory albums)
-- ============================================================
create table if not exists public.photobooth_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  cover_media_id uuid references public.media(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.photobooth_collections enable row level security;

create policy "Users can manage own collections"
  on public.photobooth_collections for all
  using (user_id = auth.uid());

-- Junction table: which media belongs to which collection
create table if not exists public.collection_media (
  collection_id uuid not null references public.photobooth_collections(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  sort_order integer default 0,
  primary key (collection_id, media_id)
);

alter table public.collection_media enable row level security;

create policy "Collection owners can manage media"
  on public.collection_media for all
  using (collection_id in (
    select id from public.photobooth_collections where user_id = auth.uid()
  ));

-- ============================================================
-- 10. TASTE SNAPSHOTS (DNA card evolution over time)
-- ============================================================
create table if not exists public.taste_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selections jsonb not null default '{}',
  entity_ids jsonb not null default '{}',
  extras jsonb not null default '{}',
  trigger text not null default 'quiz' check (trigger in ('quiz', 'event', 'manual', 'monthly')),
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.taste_snapshots enable row level security;

create policy "Users can read own snapshots"
  on public.taste_snapshots for select
  using (user_id = auth.uid());

create policy "Users can create snapshots"
  on public.taste_snapshots for insert
  with check (user_id = auth.uid());

-- Index for chronological evolution view
create index if not exists idx_taste_snapshots_user_time
  on public.taste_snapshots (user_id, created_at desc);

-- ============================================================
-- 11. RECOMMENDATIONS (food/event/venue recs — AI-generated)
-- ============================================================
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  type text not null check (type in ('venue', 'restaurant', 'activity', 'music', 'movie')),
  name text not null,
  description text,
  image_url text,
  external_url text,
  source text, -- 'qloo', 'google_places', 'yelp', 'ai'
  source_id text, -- external entity ID
  score numeric, -- relevance/match score 0-1
  metadata jsonb default '{}', -- price range, cuisine, rating, etc.
  status text default 'suggested' check (status in ('suggested', 'saved', 'booked', 'visited', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.recommendations enable row level security;

create policy "Users can read own recommendations"
  on public.recommendations for select
  using (
    user_id = auth.uid()
    or group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "System can create recommendations"
  on public.recommendations for insert
  with check (user_id = auth.uid());

create policy "Users can update own recommendations"
  on public.recommendations for update
  using (user_id = auth.uid());

-- ============================================================
-- 12. EVENT WRAPPED (Spotify-wrapped style event summaries)
-- ============================================================
create table if not exists public.event_wrapped (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stats jsonb not null default '{}',
  -- stats contains:
  -- {
  --   total_photos: number,
  --   total_messages: number,
  --   top_emoji: string,
  --   group_vibe_match: number (0-100),
  --   personal_highlights: string[],
  --   taste_discovery: { category: string, item: string, match_pct: number }[],
  --   memorable_moments: { media_id: string, caption: string }[],
  --   group_stats: { most_active: string, best_taste_match: string, wildcard: string },
  --   music_played: { name: string, artist: string }[],
  --   venues_visited: { name: string, rating: number }[],
  --   vibe_score: number (0-100),
  --   sweet_spot_accuracy: number (0-100) -- how well the AI matched preferences
  -- }
  slides jsonb not null default '[]', -- pre-rendered slide data for the wrapped experience
  generated_at timestamptz not null default now(),
  viewed_at timestamptz,
  shared boolean default false,
  unique (event_id, user_id)
);

alter table public.event_wrapped enable row level security;

create policy "Users can read own wrapped"
  on public.event_wrapped for select
  using (user_id = auth.uid());

create policy "System can create wrapped"
  on public.event_wrapped for insert
  with check (user_id = auth.uid());

create policy "Users can update own wrapped"
  on public.event_wrapped for update
  using (user_id = auth.uid());

-- ============================================================
-- TRIGGERS: auto-update updated_at on all tables with that column
-- ============================================================
create trigger on_groups_updated before update on public.groups
  for each row execute function public.handle_updated_at();

create trigger on_events_updated before update on public.events
  for each row execute function public.handle_updated_at();

-- ============================================================
-- REALTIME: enable for messaging
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_participants;

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard if needed)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('media', 'media', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
