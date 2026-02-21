-- 原子扣除 insight，成功返回剩余值，失败返回 null
CREATE OR REPLACE FUNCTION public.consume_insight(p_user_id uuid, p_amount int, p_reason text DEFAULT null)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_remaining int;
BEGIN
  UPDATE public.profiles
  SET insight = insight - p_amount
  WHERE id = p_user_id AND insight >= p_amount
  RETURNING insight INTO v_remaining;
  RETURN v_remaining;
END;
$$;

-- 原子增加 insight
CREATE OR REPLACE FUNCTION public.gain_insight(p_user_id uuid, p_amount int, p_reason text DEFAULT null)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new int;
BEGIN
  UPDATE public.profiles SET insight = insight + p_amount WHERE id = p_user_id RETURNING insight INTO v_new;
  RETURN v_new;
END;
$$;
