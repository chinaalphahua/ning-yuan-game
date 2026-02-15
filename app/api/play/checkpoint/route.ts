import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STAT_KEYS, statsToVector, cosineSimilarity, toResonancePercent } from "@/lib/stats";
import { NextResponse } from "next/server";

const TIERS = [20, 40, 60, 80, 100] as const;
type Tier = (typeof TIERS)[number];

function isTier(n: number): n is Tier {
  return TIERS.includes(n as Tier);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const { tier, stats, answer_vector } = body as {
      tier?: number;
      stats?: Record<string, number>;
      answer_vector?: string[];
    };
    if (!tier || !isTier(tier) || !stats || typeof stats !== "object") {
      return NextResponse.json({ error: "tier 与 stats 必填且合法" }, { status: 400 });
    }

    const statsSafe: Record<string, number> = {};
    for (const k of STAT_KEYS) {
      const v = stats[k];
      statsSafe[k] = typeof v === "number" ? Math.max(0, Math.min(100, v)) : 50;
    }

    const admin = createAdminClient();

    await admin.from("play_sessions").upsert(
      {
        user_id: user.id,
        tier,
        stats: statsSafe,
        answer_vector: answer_vector ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tier" }
    );

    const { data: myProfile } = await admin.from("profiles").select("soul_id").eq("id", user.id).single();
    const mySoulId = myProfile?.soul_id ?? null;

    const { data: others } = await admin
      .from("play_sessions")
      .select("user_id, stats")
      .eq("tier", tier)
      .neq("user_id", user.id);

    const myVec = statsToVector(statsSafe);
    const withSimilarity: { user_id: string; soul_id: string; similarity: number }[] = [];

    for (const row of others ?? []) {
      const { data: prof } = await admin.from("profiles").select("soul_id").eq("id", row.user_id).single();
      const soulId = prof?.soul_id;
      if (!soulId) continue;
      const theirStats = (row.stats as Record<string, number>) ?? {};
      const theirVec = statsToVector(theirStats);
      const sim = cosineSimilarity(myVec, theirVec);
      withSimilarity.push({ user_id: row.user_id, soul_id: soulId, similarity: sim });
    }

    withSimilarity.sort((a, b) => b.similarity - a.similarity);
    const top3 = withSimilarity.slice(0, 3);
    const matchedSoulIds = top3.map((x) => x.soul_id);

    await admin.from("soul_matches").upsert(
      {
        user_id: user.id,
        tier,
        matched_soul_ids: matchedSoulIds,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tier" }
    );

    const matches = top3.map((m) => ({
      soul_id: m.soul_id,
      resonance: toResonancePercent(m.similarity),
    }));

    return NextResponse.json({ soul_id: mySoulId, matches });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
