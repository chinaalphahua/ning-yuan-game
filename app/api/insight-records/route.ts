import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const admin = createAdminClient();
    const { data: records, error } = await admin
      .from("insight_records")
      .select("id, content, depth_score, ai_comment, insight_rank, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: "查询失败" }, { status: 500 });

    return NextResponse.json({ records: records ?? [], page, limit });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
