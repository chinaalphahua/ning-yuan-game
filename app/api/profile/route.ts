import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const admin = createAdminClient();

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, soul_id, display_name, level, xp, points, insight, created_at, equipped_hair_key, equipped_face_key, equipped_accessory_key")
      .eq("id", user.id)
      .single();
    if (profErr || !profile)
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const { data: userAchievements } = await admin
      .from("user_achievements")
      .select("achievement_key, unlocked_at")
      .eq("user_id", user.id);
    const { data: allAchievements } = await admin.from("achievements").select("key, name, description, icon");
    const achMap = new Map((allAchievements ?? []).map((a) => [a.key, a]));

    const { data: userBadges } = await admin
      .from("user_badges")
      .select("badge_key, unlocked_at")
      .eq("user_id", user.id);
    const { data: allBadges } = await admin.from("badges").select("key, name, description, icon");
    const badgeMap = new Map((allBadges ?? []).map((b) => [b.key, b]));

    const { data: userPrivs } = await admin
      .from("user_privileges")
      .select("privilege_key")
      .eq("user_id", user.id);
    const { data: allPrivs } = await admin.from("privileges").select("key, name");
    const privMap = new Map((allPrivs ?? []).map((p) => [p.key, p.name ?? p.key]));

    const { data: insightRecords } = await admin
      .from("insight_records")
      .select("id, content, depth_score, ai_comment, insight_rank, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const achievements = (userAchievements ?? []).map((ua) => {
      const a = achMap.get(ua.achievement_key);
      return {
        key: ua.achievement_key,
        name: a?.name ?? ua.achievement_key,
        description: a?.description ?? null,
        icon: a?.icon ?? null,
        unlocked_at: ua.unlocked_at,
      };
    });

    const badges = (userBadges ?? []).map((ub) => {
      const b = badgeMap.get(ub.badge_key);
      return {
        key: ub.badge_key,
        name: b?.name ?? ub.badge_key,
        description: b?.description ?? null,
        icon: b?.icon ?? null,
        unlocked_at: ub.unlocked_at,
      };
    });

    const privileges = (userPrivs ?? []).map((up) => ({
      key: up.privilege_key,
      name: privMap.get(up.privilege_key) ?? up.privilege_key,
    }));

    return NextResponse.json({
      profile: {
        id: profile.id,
        soul_id: profile.soul_id,
        display_name: profile.display_name,
        level: profile.level,
        xp: profile.xp,
        points: profile.points,
        insight: profile.insight,
        created_at: profile.created_at,
        equipped_hair_key: profile.equipped_hair_key ?? null,
        equipped_face_key: profile.equipped_face_key ?? null,
        equipped_accessory_key: profile.equipped_accessory_key ?? null,
      },
      achievements,
      badges,
      privileges,
      insight_records: insightRecords ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
