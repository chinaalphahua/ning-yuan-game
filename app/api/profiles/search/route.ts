import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json({ list: [] });
    }

    const admin = createAdminClient();
    const { data: myProfile } = await admin.from("profiles").select("id").eq("id", user.id).single();

    const escaped = q.replace(/"/g, '""');
    const pattern = `"%${escaped}%"`;
    const { data: rows } = await admin
      .from("profiles")
      .select("id, soul_id, display_name")
      .or(`soul_id.ilike.${pattern},display_name.ilike.${pattern}`)
      .limit(20);

    const myId = myProfile?.id ?? "";
    const list = (rows ?? [])
      .filter((p) => p.soul_id && p.id !== myId)
      .map((p) => ({ soul_id: p.soul_id, display_name: p.display_name ?? null }));

    return NextResponse.json({ list });
  } catch {
    return NextResponse.json({ error: "服务器错误", list: [] }, { status: 500 });
  }
}
