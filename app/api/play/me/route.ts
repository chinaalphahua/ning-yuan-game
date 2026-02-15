import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TIERS = [20, 40, 60, 80, 100];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ maxTier: null }, { status: 200 });

    const { data: rows } = await supabase
      .from("play_sessions")
      .select("tier")
      .eq("user_id", user.id);

    const tiers = (rows ?? [])
      .map((r) => r.tier as number)
      .filter((t) => TIERS.includes(t));
    const maxTier = tiers.length > 0 ? Math.max(...tiers) : null;

    return NextResponse.json({ maxTier });
  } catch {
    return NextResponse.json({ maxTier: null }, { status: 500 });
  }
}
