import { createAdminClient } from "@/lib/supabase/admin";

/** 增加 insight，返回最新余额 */
export async function gainInsight(
  userId: string,
  amount: number,
  reason?: string
): Promise<number> {
  if (amount <= 0) throw new Error("gainInsight: amount 必须大于 0");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("gain_insight", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  if (data == null) throw new Error("用户不存在");
  return data as number;
}

/** 扣除 insight，余额不足时抛出 Error("余额不足") */
export async function consumeInsight(
  userId: string,
  amount: number,
  reason?: string
): Promise<number> {
  if (amount <= 0) throw new Error("consumeInsight: amount 必须大于 0");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_insight", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  if (data == null) throw new Error("余额不足");
  return data as number;
}

/** 查询是否足够，不修改数据 */
export async function canAfford(userId: string, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("insight")
    .eq("id", userId)
    .single();
  if (error || !profile) return false;
  const insight = (profile.insight as number) ?? 0;
  return insight >= amount;
}
