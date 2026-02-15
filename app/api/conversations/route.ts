import { createClient } from "@/lib/supabase/server";
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

    const list: { id: string; other_soul_id: string; status: string; created_at: string }[] = [];
    for (const r of rows ?? []) {
      const otherId = r.user_a_id === user.id ? r.user_b_id : r.user_a_id;
      const { data: prof } = await supabase.from("profiles").select("soul_id").eq("id", otherId).single();
      list.push({
        id: r.id,
        other_soul_id: prof?.soul_id ?? "",
        status: r.status,
        created_at: r.created_at,
      });
    }
    return NextResponse.json({ conversations: list });
  } catch {
    return NextResponse.json({ conversations: [] }, { status: 500 });
  }
}
