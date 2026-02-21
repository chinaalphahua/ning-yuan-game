import { createAdminClient } from "@/lib/supabase/admin";

export interface UserGrowth {
  level: number;
  insight: number;
}

export interface Privilege {
  key: string;
  required_level: number | null;
  required_insight: number | null;
}

/** 检查用户是否满足权利解锁条件 */
export function canUnlock(growth: UserGrowth, privilege: Privilege): boolean {
  if (privilege.required_level != null && growth.level < privilege.required_level) return false;
  if (privilege.required_insight != null && growth.insight < privilege.required_insight) return false;
  return true;
}

/** 解锁权利（需满足条件，重复解锁会忽略） */
export async function unlock(userId: string, privilegeKey: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("level, insight").eq("id", userId).single();
  if (!profile) throw new Error("用户不存在");

  const { data: priv } = await admin.from("privileges").select("key, required_level, required_insight").eq("key", privilegeKey).single();
  if (!priv) throw new Error("权利不存在");

  const growth: UserGrowth = {
    level: (profile.level as number) ?? 1,
    insight: (profile.insight as number) ?? 0,
  };
  if (!canUnlock(growth, priv)) return false;

  const { error } = await admin.from("user_privileges").upsert(
    { user_id: userId, privilege_key: privilegeKey, unlocked_at: new Date().toISOString() },
    { onConflict: "user_id,privilege_key", ignoreDuplicates: true }
  );
  if (error) throw error;
  return true;
}
