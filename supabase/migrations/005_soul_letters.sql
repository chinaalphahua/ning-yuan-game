-- 宁愿 · 人生笺言：用户间基于灵魂匹配的单向笺言与回应

CREATE TABLE IF NOT EXISTS public.soul_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier int NOT NULL CHECK (tier IN (20, 40, 60, 80, 100)),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'reported')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_soul_letters_sender ON public.soul_letters(sender_id);
CREATE INDEX IF NOT EXISTS idx_soul_letters_recipient ON public.soul_letters(recipient_id);

ALTER TABLE public.soul_letters ENABLE ROW LEVEL SECURITY;

-- 发送方：只能写入自己发送的笺言；收发双方：可以查看自己的笺言；接收方：可以更新状态
DROP POLICY IF EXISTS "Users can insert own soul_letters" ON public.soul_letters;
CREATE POLICY "Users can insert own soul_letters" ON public.soul_letters
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can read own soul_letters" ON public.soul_letters;
CREATE POLICY "Users can read own soul_letters" ON public.soul_letters
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Recipients can update soul_letters" ON public.soul_letters;
CREATE POLICY "Recipients can update soul_letters" ON public.soul_letters
  FOR UPDATE
  USING (auth.uid() = recipient_id);

