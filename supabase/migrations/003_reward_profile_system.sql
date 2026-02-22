-- 答题升级奖励系统 + 个人主页：profiles.points、insight_records、achievements、badges、check_ins

-- 1. profiles 扩展：points
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_points') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_points CHECK (points >= 0);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. insight_records
CREATE TABLE IF NOT EXISTS public.insight_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  depth_score int CHECK (depth_score >= 1 AND depth_score <= 10),
  ai_comment text,
  insight_rank text CHECK (insight_rank IN ('S', 'A', 'B', 'C')),
  source text NOT NULL DEFAULT 'question' CHECK (source IN ('question', 'checkpoint', 'achievement')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insight_records_user ON public.insight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_records_created ON public.insight_records(created_at DESC);

-- 3. achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  exp_reward int NOT NULL DEFAULT 0,
  points_reward int NOT NULL DEFAULT 0,
  insight_reward int NOT NULL DEFAULT 0,
  condition_type text NOT NULL CHECK (condition_type IN ('questions_count', 'streak_days', 'level', 'custom')),
  condition_value jsonb DEFAULT '{}'
);

-- 4. user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key text NOT NULL REFERENCES public.achievements(key) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- 5. badges
CREATE TABLE IF NOT EXISTS public.badges (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  required_level int,
  required_achievements jsonb DEFAULT '[]'
);

-- 6. user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL REFERENCES public.badges(key) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- 7. check_ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  streak_days int NOT NULL DEFAULT 1,
  exp_reward int NOT NULL DEFAULT 0,
  points_reward int NOT NULL DEFAULT 0,
  UNIQUE(user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(check_in_date DESC);

-- Seed achievements
INSERT INTO public.achievements (key, name, description, icon, exp_reward, points_reward, insight_reward, condition_type, condition_value)
VALUES
  ('first_10', '初试锋芒', '完成 10 题', 'star', 20, 30, 2, 'questions_count', '{"count": 10}'),
  ('first_50', '半程觉醒', '完成 50 题', 'star', 50, 80, 5, 'questions_count', '{"count": 50}'),
  ('first_100', '灵魂圆满', '完成 100 题', 'star', 100, 150, 10, 'questions_count', '{"count": 100}'),
  ('streak_7', '七日行者', '连续签到 7 天', 'flame', 50, 100, 3, 'streak_days', '{"days": 7}')
ON CONFLICT (key) DO NOTHING;

-- Seed badges
INSERT INTO public.badges (key, name, description, icon, required_level, required_achievements)
VALUES
  ('first_journey', '初次启程', '完成首题', 'badge', 1, '[]'),
  ('thinker', '思想者', '完成 50 题', 'badge', 2, '["first_50"]')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.insight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT USING (true);

CREATE POLICY "Users can read own insight_records" ON public.insight_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insight_records" ON public.insight_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own user_achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own user_badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own check_ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check_ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
