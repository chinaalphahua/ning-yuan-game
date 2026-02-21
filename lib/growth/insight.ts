import { createAdminClient } from "@/lib/supabase/admin";

/** 增加 insight（如奖励） */
export async function addInsight(
  userId: string,
  amount: number,
  _reason?: string
): Promise<number> {
  if (amount <= 0) throw new Error("addInsight: amount 必须大于 0");
  const admin = createAdminClient();

  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("insight")
    .eq("id", userId)
    .single();
  if (fetchErr || !profile) throw new Error("用户不存在");

  const current = (profile.insight as number) ?? 0;
  const next = current + amount;

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ insight: next })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  return next;
}

/** 扣除 insight（如消费） */
export async function spendInsight(
  userId: string,
  amount: number,
  _reason?: string
): Promise<number> {
  if (amount <= 0) throw new Error("spendInsight: amount 必须大于 0");
  const admin = createAdminClient();

  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("insight")
    .eq("id", userId)
    .single();
  if (fetchErr || !profile) throw new Error("用户不存在");

  const current = (profile.insight as number) ?? 0;
  if (current < amount) throw new Error("insight 不足");
  const next = current - amount;

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ insight: next })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  return next;
}
