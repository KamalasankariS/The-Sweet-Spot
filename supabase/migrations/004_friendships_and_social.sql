-- ============================================================
-- FRIENDSHIPS (Instagram/Facebook-style friend system)
-- ============================================================
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate requests in either direction
  unique (requester_id, addressee_id),
  -- Prevent self-friending
  check (requester_id != addressee_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they're involved in
create policy "Users can read own friendships"
  on public.friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Users can send friend requests
create policy "Users can create friend requests"
  on public.friendships for insert
  with check (requester_id = auth.uid());

-- Users can update friendships they're involved in (accept/block)
create policy "Users can update own friendships"
  on public.friendships for update
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Users can delete friendships they're involved in (unfriend/cancel)
create policy "Users can delete own friendships"
  on public.friendships for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Fast lookups
create index if not exists idx_friendships_requester on public.friendships (requester_id, status);
create index if not exists idx_friendships_addressee on public.friendships (addressee_id, status);
create index if not exists idx_friendships_pair on public.friendships (requester_id, addressee_id);

-- Enable realtime for live friend request updates
alter publication supabase_realtime add table public.friendships;

-- ============================================================
-- Extend notifications for friend requests
-- ============================================================
-- Drop and recreate the check constraint to add friend_request and friend_accepted
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'share_request', 'share_approved', 'share_denied',
    'profile_shared', 'profile_received',
    'group_invite', 'new_message',
    'event_reminder', 'event_wrapped', 'recommendation',
    'friend_request', 'friend_accepted'
  ));

-- ============================================================
-- Allow conversation creation by authenticated users
-- ============================================================
create policy "Auth users can create conversations"
  on public.conversations for insert
  with check (true);

-- Allow users to add participants to conversations they're in
create policy "Users can add participants"
  on public.conversation_participants for insert
  with check (
    user_id = auth.uid()
    or conversation_id in (
      select conversation_id from public.conversation_participants where user_id = auth.uid()
    )
  );

-- Enable realtime for messages and conversation participants
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_participants;

-- ============================================================
-- Helper: get or create DM conversation between two users
-- ============================================================
create or replace function public.get_or_create_dm(other_user_id uuid)
returns uuid as $$
declare
  conv_id uuid;
  my_id uuid := auth.uid();
begin
  -- Find existing DM between these two users
  select cp1.conversation_id into conv_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  join public.conversations c on c.id = cp1.conversation_id
  where c.type = 'dm'
    and cp1.user_id = my_id
    and cp2.user_id = other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  -- Create new DM conversation
  insert into public.conversations (type) values ('dm') returning id into conv_id;
  insert into public.conversation_participants (conversation_id, user_id) values (conv_id, my_id);
  insert into public.conversation_participants (conversation_id, user_id) values (conv_id, other_user_id);

  return conv_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Auto-update friendships.updated_at
-- ============================================================
create trigger on_friendships_updated
  before update on public.friendships
  for each row execute function public.handle_updated_at();
