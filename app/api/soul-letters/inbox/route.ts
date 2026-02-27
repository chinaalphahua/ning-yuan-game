import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ letters: [] }, { status: 200 });

    const { data: rows } = await supabase
      .from("soul_letters")
      .select("id, sender_id, tier, content, status, created_at, responded_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (!rows?.length) return NextResponse.json({ letters: [] });

    const admin = createAdminClient();
    const senderIds = Array.from(new Set(rows.map((r) => r.sender_id as string)));
    const { data: senders } = await admin
      .from("profiles")
      .select("id, soul_id, display_name")
      .in("id", senderIds);
    const byId = new Map<string, { soul_id: string; display_name: string | null }>();
    for (const s of senders ?? []) {
      byId.set(s.id as string, {
        soul_id: s.soul_id as string,
        display_name: (s.display_name as string | null) ?? null,
      });
    }

    const letters = rows.map((r) => {
      const sender = byId.get(r.sender_id as string);
      return {
        id: r.id as string,
        tier: r.tier as number,
        content: r.content as string,
        status: r.status as string,
        created_at: r.created_at as string,
        responded_at: (r.responded_at as string | null) ?? null,
        sender_soul_id: sender?.soul_id ?? "",
        sender_display_name: sender?.display_name ?? null,
      };
    });

    return NextResponse.json({ letters });
  } catch {
    return NextResponse.json({ letters: [] }, { status: 500 });
  }
}

