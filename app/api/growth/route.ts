import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unlock, canUnlock } from "@/lib/growth/privilege";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("level, xp, points, insight")
      .eq("id", user.id)
      .single();
    if (profErr || !profile)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const { data: allPrivs } = await admin.from("privileges").select("key, name, required_level, required_insight");
    const { data: userPrivs } = await admin
      .from("user_privileges")
      .select("privilege_key")
      .eq("user_id", user.id);
    const unlockedSet = new Set((userPrivs ?? []).map((p) => p.privilege_key));
    const growth = {
      level: (profile.level as number) ?? 1,
      insight: (profile.insight as number) ?? 0,
    };
    for (const p of allPrivs ?? []) {
      if (!unlockedSet.has(p.key) && canUnlock(growth, p)) {
        try {
          await unlock(user.id, p.key);
          unlockedSet.add(p.key);
        } catch (_) {}
      }
    }

    const unlockedKeys = Array.from(unlockedSet);
    const privMap = new Map((allPrivs ?? []).map((p) => [p.key, p.name ?? p.key]));
    const privileges = unlockedKeys.map((key) => ({
      key,
      name: privMap.get(key) ?? key,
    }));

    return NextResponse.json({
      level: (profile.level as number) ?? 1,
      xp: (profile.xp as number) ?? 0,
      points: (profile.points as number) ?? 0,
      insight: (profile.insight as number) ?? 0,
      privileges,
      privilege_keys: unlockedKeys,
    });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
