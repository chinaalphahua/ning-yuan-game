import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardXp } from "@/lib/growth/xp";
import { addPoints } from "@/lib/growth/points";
import { NextResponse } from "next/server";

function getStreakRewards(streakDays: number): { exp: number; points: number } {
  if (streakDays >= 7) return { exp: 50, points: 100 };
  if (streakDays >= 3) return { exp: 15, points: 30 };
  return { exp: 5, points: 10 };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("check_in_date", today)
      .single();
    if (existing) return NextResponse.json({ error: "今日已签到", already_checked: true }, { status: 400 });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const { data: yesterdayCheckIn } = await admin
      .from("check_ins")
      .select("streak_days")
      .eq("user_id", user.id)
      .eq("check_in_date", yesterdayStr)
      .single();

    const streakDays = yesterdayCheckIn ? (yesterdayCheckIn.streak_days as number) + 1 : 1;

    const rewards = getStreakRewards(streakDays);

    await admin.from("check_ins").insert({
      user_id: user.id,
      check_in_date: today,
      streak_days: streakDays,
      exp_reward: rewards.exp,
      points_reward: rewards.points,
    });

    await awardXp(user.id, rewards.exp, "checkpoint");
    await addPoints(user.id, rewards.points);

    const { data: profile } = await admin
      .from("profiles")
      .select("level, xp, points")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      streak_days: streakDays,
      exp_reward: rewards.exp,
      points_reward: rewards.points,
      level: profile?.level ?? 1,
      xp: profile?.xp ?? 0,
      points: profile?.points ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
