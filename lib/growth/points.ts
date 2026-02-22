import { createAdminClient } from "@/lib/supabase/admin";

/** 增加积分 */
export async function addPoints(userId: string, amount: number): Promise<number> {
  if (amount <= 0) throw new Error("addPoints: amount 必须大于 0");
  const admin = createAdminClient();

  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single();
  if (fetchErr || !profile) throw new Error("用户不存在");

  const current = (profile.points as number) ?? 0;
  const next = current + amount;

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ points: next })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  return next;
}
