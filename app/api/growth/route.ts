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
      .select("level, xp, insight")
      .eq("id", user.id)
      .single();
    if (profErr || !profile)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const { data: allPrivs } = await admin.from("privileges").select("key, required_level, required_insight");
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

    const privileges = Array.from(unlockedSet);

    return NextResponse.json({
      level: (profile.level as number) ?? 1,
      xp: (profile.xp as number) ?? 0,
      insight: (profile.insight as number) ?? 0,
      privileges,
    });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
