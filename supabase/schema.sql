-- Run this in Supabase SQL Editor to create tables.
-- Extends Supabase auth.users (id, email, etc.).

-- Profiles: soul_id and display_name for each auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  soul_id text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Play progress: one row per user per tier (stats at that tier)
create table if not exists public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier int not null check (tier in (20, 40, 60, 80, 100)),
  stats jsonb not null default '{}',
  answer_vector jsonb,
  updated_at timestamptz default now(),
  unique(user_id, tier)
);

-- Soul mate matches per user per tier
create table if not exists public.soul_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier int not null check (tier in (20, 40, 60, 80, 100)),
  matched_soul_ids jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(user_id, tier)
);

-- 1v1 conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(user_a_id, user_b_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_play_sessions_user on public.play_sessions(user_id);
create index if not exists idx_soul_matches_user_tier on public.soul_matches(user_id, tier);
create index if not exists idx_conversations_users on public.conversations(user_a_id, user_b_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);

-- RLS: enable and add policies as needed (e.g. users can read/write own profiles, own play_sessions, etc.)
alter table public.profiles enable row level security;
alter table public.play_sessions enable row level security;
alter table public.soul_matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can read own play_sessions" on public.play_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own play_sessions" on public.play_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own play_sessions" on public.play_sessions for update using (auth.uid() = user_id);
create policy "Users can read own soul_matches" on public.soul_matches for select using (auth.uid() = user_id);
create policy "Users can insert own soul_matches" on public.soul_matches for insert with check (auth.uid() = user_id);
create policy "Users can update own soul_matches" on public.soul_matches for update using (auth.uid() = user_id);
create policy "Users can read conversations they are in" on public.conversations for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can insert conversations" on public.conversations for insert with check (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can update conversations they are in" on public.conversations for update using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can read messages of their conversations" on public.messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);
create policy "Users can insert messages in accepted conversations" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.status = 'accepted' and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);
