-- 成长与奖励系统迁移
-- 在 Supabase SQL Editor 中执行（若已有 profiles 表）

-- 1. profiles 新增 level, xp, insight
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insight int NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_level') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_level CHECK (level >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_xp') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_xp CHECK (xp >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_insight') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_insight CHECK (insight >= 0);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. privileges 配置表
CREATE TABLE IF NOT EXISTS public.privileges (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  required_level int,
  required_insight int
);

-- 初始权利配置（可选）
INSERT INTO public.privileges (key, name, description, required_level, required_insight)
VALUES
  ('view_soul_matches', '查看灵魂匹配', '解锁灵魂契合度展示', 1, null),
  ('view_similar_souls', '查看相似灵魂', '解锁相似灵魂推荐', 2, null)
ON CONFLICT (key) DO NOTHING;

-- 3. user_privileges
CREATE TABLE IF NOT EXISTS public.user_privileges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  privilege_key text NOT NULL REFERENCES public.privileges(key) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, privilege_key)
);

CREATE INDEX IF NOT EXISTS idx_user_privileges_user ON public.user_privileges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_privileges_key ON public.user_privileges(privilege_key);

ALTER TABLE public.privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privileges ENABLE ROW LEVEL SECURITY;

-- privileges 为配置表，所有人可读
CREATE POLICY "Anyone can read privileges" ON public.privileges FOR SELECT USING (true);

CREATE POLICY "Users can read own user_privileges" ON public.user_privileges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_privileges" ON public.user_privileges FOR INSERT WITH CHECK (auth.uid() = user_id);
