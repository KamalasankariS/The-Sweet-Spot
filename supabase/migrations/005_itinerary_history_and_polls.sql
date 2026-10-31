-- ============================================================
-- ITINERARY HISTORY (track completed events + stop feedback)
-- ============================================================
create table if not exists public.itinerary_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  event_type text,
  location text,
  itinerary jsonb not null default '[]',
  stops_feedback jsonb not null default '[]',
  -- stops_feedback: [{ stopId, placeName, placeEntityId, category, confirmed: bool, alternativePlace?, alternativeEntityId?, rating? }]
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.itinerary_completions enable row level security;

create policy "Users can manage own completions"
  on public.itinerary_completions for all
  using (user_id = auth.uid());

create index idx_completions_user on public.itinerary_completions (user_id, completed_at desc);

-- ============================================================
-- POLL VOTES (for chat polls)
-- ============================================================
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index integer not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id) -- one vote per user per poll
);

alter table public.poll_votes enable row level security;

create policy "Conversation members can vote"
  on public.poll_votes for all
  using (
    message_id in (
      select m.id from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where cp.user_id = auth.uid()
    )
  );

create policy "Users can insert votes"
  on public.poll_votes for insert
  with check (user_id = auth.uid());

-- Enable realtime for live poll updates
alter publication supabase_realtime add table public.poll_votes;

create index idx_poll_votes_message on public.poll_votes (message_id);

-- ============================================================
-- Extend message types to support polls
-- ============================================================
alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check
  check (type in ('text', 'image', 'video', 'system', 'recommendation', 'itinerary', 'poll'));

-- ============================================================
-- Extend notification types for stop reminders
-- ============================================================
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'share_request', 'share_approved', 'share_denied',
    'profile_shared', 'profile_received',
    'group_invite', 'new_message',
    'event_reminder', 'event_wrapped', 'recommendation',
    'friend_request', 'friend_accepted',
    'stop_reminder', 'poll_created'
  ));
