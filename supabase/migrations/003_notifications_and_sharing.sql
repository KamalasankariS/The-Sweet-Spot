-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'share_request',      -- someone wants to share your profile
    'share_approved',     -- your share request was approved
    'share_denied',       -- your share request was denied
    'profile_shared',     -- your profile was shared with someone
    'profile_received',   -- someone shared a profile with you
    'group_invite',
    'new_message',
    'event_reminder',
    'event_wrapped',
    'recommendation'
  )),
  title text not null,
  body text,
  data jsonb not null default '{}',
  -- data contains context-specific fields:
  -- share_request:   { requester_id, requester_username, profile_owner_id }
  -- profile_shared:  { sharer_id, sharer_username, recipient_id, recipient_username, profile_owner_id }
  -- profile_received:{ sharer_id, sharer_username, profile_owner_id, profile_owner_username }
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "System can create notifications"
  on public.notifications for insert
  with check (true); -- edge functions insert on behalf of users

create index idx_notifications_user_unread
  on public.notifications (user_id, read, created_at desc);

-- Enable realtime for live notification updates
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- PROFILE SHARE REQUESTS (approval workflow)
-- ============================================================
create table if not exists public.profile_share_requests (
  id uuid primary key default gen_random_uuid(),
  profile_owner_id uuid not null references auth.users(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.profile_share_requests enable row level security;

create policy "Profile owners can see and manage requests"
  on public.profile_share_requests for all
  using (profile_owner_id = auth.uid());

create policy "Requesters can see own requests"
  on public.profile_share_requests for select
  using (requester_id = auth.uid());

create policy "Users can create share requests"
  on public.profile_share_requests for insert
  with check (requester_id = auth.uid());

-- ============================================================
-- PROFILE SHARES (completed shares — the "shared with" log)
-- ============================================================
create table if not exists public.profile_shares (
  id uuid primary key default gen_random_uuid(),
  profile_owner_id uuid not null references auth.users(id) on delete cascade,
  shared_by uuid not null references auth.users(id) on delete cascade,
  shared_with uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profile_shares enable row level security;

create policy "Involved users can see shares"
  on public.profile_shares for select
  using (
    profile_owner_id = auth.uid()
    or shared_by = auth.uid()
    or shared_with = auth.uid()
  );

create policy "Users can create shares"
  on public.profile_shares for insert
  with check (shared_by = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app boolean not null default true,
  push boolean not null default true,
  email_instant boolean not null default true,     -- immediate emails
  email_digest boolean not null default false,      -- daily digest instead
  share_requests boolean not null default true,
  messages boolean not null default true,
  group_invites boolean not null default true,
  event_reminders boolean not null default true,
  recommendations boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can manage own preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid());

-- ============================================================
-- PUSH SUBSCRIPTIONS (Web Push + FCM device tokens)
-- ============================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('web', 'fcm_android', 'fcm_ios')),
  subscription jsonb not null, -- Web Push subscription object or FCM token
  device_name text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on public.push_subscriptions for all
  using (user_id = auth.uid());
