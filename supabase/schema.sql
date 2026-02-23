-- Run this in Supabase SQL Editor to create tables.
-- Extends Supabase auth.users (id, email, etc.).

-- Profiles: soul_id and display_name for each auth user; level/xp/insight for growth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  soul_id text unique not null,
  display_name text,
  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  insight int not null default 0 check (insight >= 0),
  points int not null default 0 check (points >= 0),
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

-- Groups (群聊)
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null default '未命名群聊',
  created_by_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Privileges config (growth system)
create table if not exists public.privileges (
  key text primary key,
  name text not null,
  description text,
  required_level int,
  required_insight int
);

create table if not exists public.user_privileges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  privilege_key text not null references public.privileges(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, privilege_key)
);

create index if not exists idx_play_sessions_user on public.play_sessions(user_id);
create index if not exists idx_soul_matches_user_tier on public.soul_matches(user_id, tier);
create index if not exists idx_conversations_users on public.conversations(user_a_id, user_b_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_messages_group on public.group_messages(group_id);
create index if not exists idx_user_privileges_user on public.user_privileges(user_id);
create index if not exists idx_user_privileges_key on public.user_privileges(privilege_key);

-- Insight records (growth system)
create table if not exists public.insight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  depth_score int check (depth_score >= 1 and depth_score <= 10),
  ai_comment text,
  insight_rank text check (insight_rank in ('S', 'A', 'B', 'C')),
  source text not null default 'question' check (source in ('question', 'checkpoint', 'achievement')),
  created_at timestamptz not null default now()
);
create index if not exists idx_insight_records_user on public.insight_records(user_id);
create index if not exists idx_insight_records_created on public.insight_records(created_at desc);

-- Achievements config
create table if not exists public.achievements (
  key text primary key,
  name text not null,
  description text,
  icon text,
  exp_reward int not null default 0,
  points_reward int not null default 0,
  insight_reward int not null default 0,
  condition_type text not null check (condition_type in ('questions_count', 'streak_days', 'level', 'custom')),
  condition_value jsonb default '{}'
);

-- User achievements
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null references public.achievements(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_key)
);
create index if not exists idx_user_achievements_user on public.user_achievements(user_id);

-- Badges config
create table if not exists public.badges (
  key text primary key,
  name text not null,
  description text,
  icon text,
  required_level int,
  required_achievements jsonb default '[]'
);

-- User badges
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null references public.badges(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, badge_key)
);
create index if not exists idx_user_badges_user on public.user_badges(user_id);

-- Check-ins
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null,
  streak_days int not null default 1,
  exp_reward int not null default 0,
  points_reward int not null default 0,
  unique(user_id, check_in_date)
);
create index if not exists idx_check_ins_user on public.check_ins(user_id);
create index if not exists idx_check_ins_date on public.check_ins(check_in_date desc);

-- RLS: enable and add policies as needed (e.g. users can read/write own profiles, own play_sessions, etc.)
alter table public.profiles enable row level security;
alter table public.play_sessions enable row level security;
alter table public.soul_matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.privileges enable row level security;
alter table public.user_privileges enable row level security;
alter table public.insight_records enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.check_ins enable row level security;

-- Seed privileges (growth system)
insert into public.privileges (key, name, description, required_level, required_insight)
values
  ('view_soul_matches', '查看灵魂匹配', '解锁灵魂契合度展示', 1, null),
  ('view_similar_souls', '查看相似灵魂', '解锁相似灵魂推荐', 2, null)
on conflict (key) do nothing;

-- Seed achievements
insert into public.achievements (key, name, description, icon, exp_reward, points_reward, insight_reward, condition_type, condition_value)
values
  ('first_10', '初试锋芒', '完成 10 题', 'star', 20, 30, 2, 'questions_count', '{"count": 10}'),
  ('first_50', '半程觉醒', '完成 50 题', 'star', 50, 80, 5, 'questions_count', '{"count": 50}'),
  ('first_100', '灵魂圆满', '完成 100 题', 'star', 100, 150, 10, 'questions_count', '{"count": 100}'),
  ('streak_7', '七日行者', '连续签到 7 天', 'flame', 50, 100, 3, 'streak_days', '{"days": 7}')
on conflict (key) do nothing;

-- Seed badges
insert into public.badges (key, name, description, icon, required_level, required_achievements)
values
  ('first_journey', '初次启程', '完成首题', 'badge', 1, '[]'),
  ('thinker', '思想者', '完成 50 题', 'badge', 2, '["first_50"]')
on conflict (key) do nothing;

create policy "Anyone can read privileges" on public.privileges for select using (true);
create policy "Users can read own user_privileges" on public.user_privileges for select using (auth.uid() = user_id);
create policy "Users can insert own user_privileges" on public.user_privileges for insert with check (auth.uid() = user_id);

create policy "Anyone can read achievements" on public.achievements for select using (true);
create policy "Anyone can read badges" on public.badges for select using (true);
create policy "Users can read own insight_records" on public.insight_records for select using (auth.uid() = user_id);
create policy "Users can insert own insight_records" on public.insight_records for insert with check (auth.uid() = user_id);
create policy "Users can read own user_achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert own user_achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "Users can read own user_badges" on public.user_badges for select using (auth.uid() = user_id);
create policy "Users can insert own user_badges" on public.user_badges for insert with check (auth.uid() = user_id);
create policy "Users can read own check_ins" on public.check_ins for select using (auth.uid() = user_id);
create policy "Users can insert own check_ins" on public.check_ins for insert with check (auth.uid() = user_id);

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

-- Groups: creators can insert; members can read/update (e.g. name). For simplicity, only creators can update.
create policy "Users can read groups they are in" on public.groups for select using (
  exists (select 1 from public.group_members gm where gm.group_id = id and gm.user_id = auth.uid())
);
create policy "Users can insert groups" on public.groups for insert with check (auth.uid() = created_by_id);
create policy "Creators can update group" on public.groups for update using (auth.uid() = created_by_id);

-- 只读自己的成员记录，避免策略内再查 group_members 导致无限递归
create policy "Users can read own group_members rows" on public.group_members for select using (auth.uid() = user_id);
create policy "Group creators or members can insert (add members)" on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_id and g.created_by_id = auth.uid())
  or exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
);
create policy "Users can delete themselves from group" on public.group_members for delete using (auth.uid() = user_id);

create policy "Members can read group_messages of their groups" on public.group_messages for select using (
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
);
create policy "Members can insert group_messages" on public.group_messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid())
);

-- Avatar cosmetics (see migration 004 for full seed and RLS)
create table if not exists public.avatar_cosmetics (
  key text primary key,
  name text not null,
  slot text not null check (slot in ('hair', 'face', 'accessory')),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  description text not null default '',
  is_default boolean not null default false
);
create table if not exists public.user_cosmetics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_key text not null references public.avatar_cosmetics(key) on delete cascade,
  quantity int not null default 1 check (quantity >= 1),
  first_obtained_at timestamptz not null default now(),
  unique(user_id, cosmetic_key)
);
create index if not exists idx_user_cosmetics_user on public.user_cosmetics(user_id);
alter table public.profiles add column if not exists equipped_hair_key text references public.avatar_cosmetics(key) on delete set null;
alter table public.profiles add column if not exists equipped_face_key text references public.avatar_cosmetics(key) on delete set null;
alter table public.profiles add column if not exists equipped_accessory_key text references public.avatar_cosmetics(key) on delete set null;
alter table public.avatar_cosmetics enable row level security;
alter table public.user_cosmetics enable row level security;
create policy "Anyone can read avatar_cosmetics" on public.avatar_cosmetics for select using (true);
create policy "Users can read own user_cosmetics" on public.user_cosmetics for select using (auth.uid() = user_id);
create policy "Users can insert own user_cosmetics" on public.user_cosmetics for insert with check (auth.uid() = user_id);
create policy "Users can update own user_cosmetics" on public.user_cosmetics for update using (auth.uid() = user_id);
