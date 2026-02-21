import { createAdminClient } from "@/lib/supabase/admin";
import { xpToLevel } from "./level";

export type XpSource = "question" | "checkpoint" | "other";

/** 授予 XP，更新 profiles.xp 与 profiles.level */
export async function awardXp(
  userId: string,
  amount: number,
  _source?: XpSource
): Promise<{ xp: number; level: number }> {
  if (amount <= 0) throw new Error("awardXp: amount 必须大于 0");
  const admin = createAdminClient();

  const { data: profile, error: fetchErr } = await admin
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();
  if (fetchErr || !profile) throw new Error("用户不存在");

  const currentXp = (profile.xp as number) ?? 0;
  const newXp = currentXp + amount;
  const newLevel = xpToLevel(newXp);

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ xp: newXp, level: newLevel })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  return { xp: newXp, level: newLevel };
}
