import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const TIERS = [20, 40, 60, 80, 100];

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ matches: [] }, { status: 200 });

    const { searchParams } = new URL(request.url);
    const tier = Number(searchParams.get("tier"));
    if (!TIERS.includes(tier)) {
      return NextResponse.json({ error: "tier 必填且为 20/40/60/80/100" }, { status: 400 });
    }

    const { data: row } = await supabase
      .from("soul_matches")
      .select("matched_soul_ids")
      .eq("user_id", user.id)
      .eq("tier", tier)
      .single();

    const soulIds = (row?.matched_soul_ids as string[] | null) ?? [];
    if (soulIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const admin = createAdminClient();
    const matches: { soul_id: string; resonance: number; stats?: Record<string, number> }[] = [];

    for (let i = 0; i < soulIds.length; i++) {
      const soulId = soulIds[i];
      const { data: profile } = await admin.from("profiles").select("id").eq("soul_id", soulId).single();
      if (!profile) continue;
      const { data: ps } = await admin
        .from("play_sessions")
        .select("stats")
        .eq("user_id", profile.id)
        .eq("tier", tier)
        .single();
      const resonance = 85 + (3 - i) * 4 + Math.floor(Math.random() * 3);
      matches.push({
        soul_id: soulId,
        resonance: Math.min(99, resonance),
        stats: (ps?.stats as Record<string, number>) ?? undefined,
      });
    }

    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ matches: [] }, { status: 500 });
  }
}
