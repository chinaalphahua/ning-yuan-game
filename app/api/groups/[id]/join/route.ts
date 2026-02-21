import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** 任意已登录用户通过群 ID 加入群聊 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id: groupId } = await params;
    if (!groupId) return NextResponse.json({ error: "group id 必填" }, { status: 400 });

    const admin = createAdminClient();
    const { data: group } = await admin.from("groups").select("id").eq("id", groupId).single();
    if (!group) return NextResponse.json({ error: "群不存在" }, { status: 404 });

    const { error } = await admin
      .from("group_members")
      .upsert({ group_id: groupId, user_id: user.id }, { onConflict: "group_id,user_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ joined: true, group_id: groupId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
