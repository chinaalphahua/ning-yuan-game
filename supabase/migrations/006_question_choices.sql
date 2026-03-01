-- 题目选择统计：每题用户选 A/B 的记录，用于展示真实占比
-- 每人每题一票，重复选择会更新为最新选择

CREATE TABLE IF NOT EXISTS public.question_choices (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id smallint NOT NULL CHECK (question_id >= 1 AND question_id <= 100),
  choice text NOT NULL CHECK (choice IN ('A', 'B')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_choices_question_id ON public.question_choices(question_id);

COMMENT ON TABLE public.question_choices IS '用户每题选 A/B 的记录，用于选项右下角真实百分比统计';
