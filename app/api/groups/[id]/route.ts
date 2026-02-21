import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id: groupId } = await params;
    if (!groupId) return NextResponse.json({ error: "group id 必填" }, { status: 400 });

    const { data: member } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "不在该群" }, { status: 403 });

    const { data: group } = await supabase.from("groups").select("id, name, created_by_id, created_at").eq("id", groupId).single();
    if (!group) return NextResponse.json({ error: "群不存在" }, { status: 404 });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
