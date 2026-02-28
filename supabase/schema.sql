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

-- Soul letters：宁愿 · 人生笺言
create table if not exists public.soul_letters (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  tier int not null check (tier in (20, 40, 60, 80, 100)),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'reported')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists idx_soul_letters_sender on public.soul_letters(sender_id);
create index if not exists idx_soul_letters_recipient on public.soul_letters(recipient_id);
alter table public.soul_letters enable row level security;
create policy "Users can insert own soul_letters" on public.soul_letters for insert with check (auth.uid() = sender_id);
create policy "Users can read own soul_letters" on public.soul_letters for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Recipients can update soul_letters" on public.soul_letters for update using (auth.uid() = recipient_id);

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

-- Avatar cosmetics (100 items: common 60%, rare 25%, epic 12%, legendary 3%)
create table if not exists public.avatar_cosmetics (
  key text primary key,
  name text not null,
  slot text not null check (slot in ('hair', 'face', 'accessory')),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  description text not null default '',
  is_default boolean not null default false
);
insert into public.avatar_cosmetics (key, name, slot, rarity, description, is_default) values
('hair_short_black', '短黑发', 'hair', 'common', '利落黑色短发，轮廓清晰。', true),
('hair_short_brown', '短褐发', 'hair', 'common', '自然褐色短发，沉稳干净。', false),
('hair_ponytail', '马尾', 'hair', 'common', '束于脑后的马尾，简洁利落。', false),
('hair_loose_long', '披肩长发', 'hair', 'common', '垂落肩头的长发，线条柔和。', false),
('hair_curly', '卷发', 'hair', 'common', '微微卷曲，层次分明。', false),
('hair_bob', '齐肩短发', 'hair', 'common', '齐肩长度，整齐好打理。', false),
('hair_messy', '凌乱发', 'hair', 'common', '略带凌乱，随性自然。', false),
('hair_slicked', '背头', 'hair', 'common', '向后梳拢，线条硬朗。', false),
('hair_bangs', '齐刘海', 'hair', 'common', '额前齐整刘海，乖巧端正。', false),
('hair_twin_tails', '双马尾', 'hair', 'common', '左右双束，对称规整。', false),
('hair_braid', '单辫', 'hair', 'common', '单条发辫，朴素大方。', false),
('hair_bun', '发髻', 'hair', 'common', '挽成发髻，端庄简洁。', false),
('hair_undercut', '侧削', 'hair', 'common', '一侧剃短，对比分明。', false),
('hair_wavy', '波浪发', 'hair', 'common', '波浪起伏，轮廓柔和。', false),
('hair_straight', '直发', 'hair', 'common', '笔直垂下，线条干净。', false),
('hair_side_part', '偏分', 'hair', 'common', '侧分线清晰，利落整齐。', false),
('hair_buzz', '寸头', 'hair', 'common', '极短寸头，干净利落。', false),
('hair_flowing', '飘逸长发', 'hair', 'common', '长发垂散，动感线条。', false),
('face_calm', '平静', 'face', 'common', '神情平静，无悲无喜。', false),
('face_smile', '微笑', 'face', 'common', '嘴角微扬，温和可亲。', false),
('face_serious', '严肃', 'face', 'common', '眉目端正，神色认真。', false),
('face_gentle', '温和', 'face', 'common', '目光柔和，令人安心。', false),
('face_neutral', '淡然', 'face', 'common', '平淡自然，不显情绪。', false),
('face_thoughtful', '沉思', 'face', 'common', '似在思考，安静内敛。', false),
('face_sleepy', '困倦', 'face', 'common', '略带困意，松弛自然。', false),
('face_focused', '专注', 'face', 'common', '目光集中，心无旁骛。', false),
('face_soft', '柔和', 'face', 'common', '轮廓与神情皆柔和。', false),
('face_reserved', '内敛', 'face', 'common', '不张扬，含蓄克制。', false),
('face_quiet', '静默', 'face', 'common', '不言不语，安静沉稳。', false),
('face_curious', '好奇', 'face', 'common', '略带探询，略显好奇。', false),
('face_tired', '疲惫', 'face', 'common', '略显疲惫，真实自然。', false),
('face_blush', '微醺', 'face', 'common', '微微泛红，如微醺之态。', false),
('face_cool', '冷峻', 'face', 'common', '线条冷硬，不苟言笑。', false),
('face_warm', '暖意', 'face', 'common', '神情温和，带一丝暖意。', false),
('face_default', '素面', 'face', 'common', '无多余修饰，最本真的面容。', true),
('acc_band', '发带', 'accessory', 'common', '一条素色发带，束发或装饰。', false),
('acc_glasses_round', '圆框镜', 'accessory', 'common', '圆形镜框，斯文干净。', false),
('acc_earring_single', '单耳环', 'accessory', 'common', '单侧耳环，简约一点。', false),
('acc_scarf', '围巾', 'accessory', 'common', '素色围巾，绕颈或垂落。', false),
('acc_hat_cap', '鸭舌帽', 'accessory', 'common', '帽檐清晰，轮廓分明。', false),
('acc_ribbon', '发绳', 'accessory', 'common', '细发绳扎发，简单实用。', false),
('acc_flower', '头花', 'accessory', 'common', '一朵素色头花，不抢眼。', false),
('acc_chain', '细链', 'accessory', 'common', '细链饰物，线条简洁。', false),
('acc_bandana', '头巾', 'accessory', 'common', '包头或束发用头巾。', false),
('acc_clip', '发夹', 'accessory', 'common', '一枚发夹，固定或点缀。', false),
('acc_hoop', '耳圈', 'accessory', 'common', '圆形耳圈，轮廓清晰。', false),
('acc_pin', '胸针', 'accessory', 'common', '一枚小胸针，点缀胸前。', false),
('acc_ring_simple', '素戒', 'accessory', 'common', '无纹素戒，低调干净。', false),
('acc_spectacles', '眼镜', 'accessory', 'common', '常规眼镜，斯文整齐。', false),
('acc_visor', '护额', 'accessory', 'common', '额前一条带，利落有型。', false),
('hair_silver_streak', '银丝一缕', 'hair', 'rare', '一缕银白发丝，在深色中格外清晰。', false),
('hair_phantom_veil', '幻影薄纱', 'hair', 'rare', '如薄纱覆发，轮廓若隐若现。', false),
('hair_moon_frost', '月霜', 'hair', 'rare', '似月光下的霜色，清冷干净。', false),
('hair_ember_flow', '余烬流', 'hair', 'rare', '如灰烬流动的线条与层次。', false),
('hair_shadow_cascade', '暗影瀑', 'hair', 'rare', '如阴影垂落，层次分明。', false),
('hair_dust_wind', '尘风', 'hair', 'rare', '似被风吹起的尘埃，轻而乱。', false),
('hair_ash_crown', '灰烬冠', 'hair', 'rare', '发如冠形，灰调沉稳。', false),
('hair_star_drift', '星屑飘', 'hair', 'rare', '发间似有星点，疏密有致。', false),
('hair_void_curl', '虚空卷', 'hair', 'rare', '深色卷曲，如入虚空。', false),
('hair_soul_weave', '魂织', 'hair', 'rare', '如灵魂编织的发丝，细密而静。', false),
('face_mirror', '镜面', 'face', 'rare', '如镜中倒影，平静无波。', false),
('face_echo', '回响', 'face', 'rare', '似有回响的神情，留有余韵。', false),
('face_whisper', '低语', 'face', 'rare', '如正在低语，含蓄克制。', false),
('face_veil', '薄暮', 'face', 'rare', '如薄暮笼罩，朦胧而静。', false),
('face_ember', '余温', 'face', 'rare', '神情带一丝将熄的余温。', false),
('face_frost', '霜痕', 'face', 'rare', '冷峻如霜，线条清晰。', false),
('face_shadow', '影迹', 'face', 'rare', '如半掩于影，神秘不张扬。', false),
('face_glow', '微光', 'face', 'rare', '神情似有微光，不刺眼。', false),
('face_ripple', '涟漪', 'face', 'rare', '情绪如水面涟漪，轻微波动。', false),
('face_silence', '静寂', 'face', 'rare', '彻底的静，无喧无扰。', false),
('acc_mask_half', '半面', 'accessory', 'rare', '遮住半脸的素色面饰。', false),
('acc_crown_thorn', '荆棘冠', 'accessory', 'rare', '如荆棘缠绕的冠形，黑白线条。', false),
('acc_orb_small', '浮珠', 'accessory', 'rare', '一颗小珠悬于身侧，圆润简洁。', false),
('acc_feather', '羽饰', 'accessory', 'rare', '一支素色羽毛，线条轻盈。', false),
('acc_chain_ritual', '仪式链', 'accessory', 'rare', '细链如仪式用，规整而克制。', false),
('acc_lens_amber', '琥珀镜片', 'accessory', 'rare', '镜片呈深琥珀色，在黑白中为深调。', false),
('acc_veil_light', '轻纱', 'accessory', 'rare', '一层轻纱，不夺目。', false),
('acc_sigil', '符纹', 'accessory', 'rare', '简单符纹饰物，线条明确。', false),
('acc_ring_band', '铭文环', 'accessory', 'rare', '环上刻有细密铭文，可辨轮廓。', false),
('acc_collar_bone', '骨扣领', 'accessory', 'rare', '领口骨扣造型，轮廓硬朗。', false),
('hair_astral_flow', '星流', 'hair', 'epic', '发如星河流泻，黑白分明。', false),
('hair_void_weave', '虚空织', 'hair', 'epic', '如从虚空中织出的发，深而密。', false),
('hair_eternal_frost', '永霜', 'hair', 'epic', '如永不消融的霜，清冽干净。', false),
('hair_ember_crown', '烬冠', 'hair', 'epic', '灰烬成冠，层次与轮廓并重。', false),
('hair_phantom_cascade', '幻瀑', 'hair', 'epic', '如幻影般的发瀑，若隐若现。', false),
('face_soul_mark', '魂印', 'face', 'epic', '如灵魂留下的印记，静而深。', false),
('face_astral_eye', '星瞳', 'face', 'epic', '目光如星，清晰而专注。', false),
('face_void_gaze', '虚空之视', 'face', 'epic', '如望向虚空，深邃冷静。', false),
('face_eternal_calm', '永恒静', 'face', 'epic', '恒久的平静，无波无澜。', false),
('face_ember_smile', '烬笑', 'face', 'epic', '如余烬中一丝笑意，克制而淡。', false),
('acc_crown_soul', '灵魂冠冕', 'accessory', 'epic', '冠冕轮廓如灵魂之形，黑白勾勒。', false),
('acc_mask_void', '虚空面', 'accessory', 'epic', '如虚空般的面饰，深色轮廓。', false),
('acc_orb_soul', '魂珠', 'accessory', 'epic', '如凝练灵魂的珠体，圆润而静。', false),
('acc_veil_astral', '星纱', 'accessory', 'epic', '如星尘织成的薄纱，细密有致。', false),
('acc_sigil_eternal', '永恒符', 'accessory', 'epic', '永恒主题的符纹，线条庄重。', false),
('hair_ningyuan', '宁愿·荒原', 'hair', 'legendary', '荒原上的风与发丝，黑白中的唯一归宿。', false),
('face_soul_sovereign', '灵魂主宰', 'face', 'legendary', '灵魂的主宰之相，平静而有力。', false),
('acc_crown_ningyuan', '宁愿冠', 'accessory', 'legendary', '宁愿之冠，荒原与灵魂的象征。', false),
('acc_orb_truth', '真理之珠', 'accessory', 'legendary', '象征真理的珠体，黑白分明。', false),
('face_truth_seeker', '真理追寻', 'face', 'legendary', '追寻真理者的神情，坚定而清澈。', false)
on conflict (key) do nothing;

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
