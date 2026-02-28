import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ conversations: [] }, { status: 200 });

    const { data: rows } = await supabase
      .from("conversations")
      .select("id, user_a_id, user_b_id, status, created_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const list: { id: string; other_soul_id: string; other_display_name: string | null; status: string; created_at: string }[] = [];
    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
    } catch {
      // 无 service role 时仅用当前用户 client 查 profiles（RLS 允许则能读到）
    }
    for (const r of rows ?? []) {
      const otherId = r.user_a_id === user.id ? r.user_b_id : r.user_a_id;
      let soul_id = "";
      let display_name: string | null = null;
      const { data: profByUser } = await supabase.from("profiles").select("soul_id, display_name").eq("id", otherId).single();
      if (profByUser) {
        soul_id = profByUser.soul_id ?? "";
        display_name = profByUser.display_name ?? null;
      } else if (admin) {
        const { data: profByAdmin } = await admin.from("profiles").select("soul_id, display_name").eq("id", otherId).single();
        soul_id = profByAdmin?.soul_id ?? "";
        display_name = profByAdmin?.display_name ?? null;
      }
      list.push({
        id: r.id,
        other_soul_id: soul_id || "未知",
        other_display_name: display_name,
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
