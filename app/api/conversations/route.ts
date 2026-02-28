import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ conversations: [] }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: rows, error: queryErr } = await admin
      .from("conversations")
      .select("id, user_a_id, user_b_id, status, created_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (queryErr) {
      console.error("conversations query error:", queryErr);
      return NextResponse.json({ conversations: [] }, { status: 500 });
    }

    const list: { id: string; other_soul_id: string; other_display_name: string | null; status: string; created_at: string }[] = [];
    for (const r of rows ?? []) {
      const otherId = r.user_a_id === user.id ? r.user_b_id : r.user_a_id;
      const { data: prof } = await admin.from("profiles").select("soul_id, display_name").eq("id", otherId).single();
      list.push({
        id: r.id,
        other_soul_id: prof?.soul_id ?? "未知",
        other_display_name: prof?.display_name ?? null,
        status: r.status,
        created_at: r.created_at,
      });
    }
    return NextResponse.json({ conversations: list });
  } catch (e) {
    console.error("conversations GET error:", e);
    return NextResponse.json({ conversations: [] }, { status: 500 });
  }
}
