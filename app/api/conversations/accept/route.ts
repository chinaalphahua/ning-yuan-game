import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const conversation_id = body?.conversation_id;
    if (typeof conversation_id !== "string" || !conversation_id) {
      return NextResponse.json({ error: "conversation_id 必填" }, { status: 400 });
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, user_a_id, user_b_id, status")
      .eq("id", conversation_id)
      .single();

    if (!conv || conv.status !== "pending") {
      return NextResponse.json({ error: "会话不存在或已处理" }, { status: 400 });
    }
    const otherId = conv.user_a_id === user.id ? conv.user_b_id : conv.user_a_id;
    if (conv.user_a_id !== user.id && conv.user_b_id !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const { error } = await supabase
      .from("conversations")
      .update({ status: "accepted" })
      .eq("id", conversation_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
