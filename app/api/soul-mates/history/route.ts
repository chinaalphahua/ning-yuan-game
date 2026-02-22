import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const TIERS = [20, 40, 60, 80, 100];

export type HistoryMatch = {
  soul_id: string;
  display_name: string | null;
  resonance: number;
  stats?: Record<string, number>;
};

export type HistoryEntry = {
  tier: number;
  created_at: string;
  matches: HistoryMatch[];
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ history: [] }, { status: 200 });

    const { data: rows } = await supabase
      .from("soul_matches")
      .select("tier, created_at, matched_soul_ids")
      .eq("user_id", user.id)
      .order("tier", { ascending: true });

    if (!rows?.length) return NextResponse.json({ history: [] });

    const admin = createAdminClient();
    const history: HistoryEntry[] = [];

    for (const row of rows) {
      const tier = row.tier as number;
      const soulIds = (row.matched_soul_ids as string[] | null) ?? [];
      const matches: HistoryMatch[] = [];

      for (let i = 0; i < soulIds.length; i++) {
        const soulId = soulIds[i];
        const { data: profile } = await admin
          .from("profiles")
          .select("id, display_name")
          .eq("soul_id", soulId)
          .single();
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
          display_name: (profile.display_name as string) ?? null,
          resonance: Math.min(99, resonance),
          stats: (ps?.stats as Record<string, number>) ?? undefined,
        });
      }

      history.push({
        tier,
        created_at: (row.created_at as string) ?? new Date().toISOString(),
        matches,
      });
    }

    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ history: [] }, { status: 500 });
  }
}
