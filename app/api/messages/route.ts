import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversation_id = searchParams.get("conversation_id");
    const since = searchParams.get("since");
    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id 必填" }, { status: 400 });
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, status")
      .eq("id", conversation_id)
      .single();
    if (!conv || conv.status !== "accepted") {
      return NextResponse.json({ error: "会话不存在或未连接" }, { status: 400 });
    }

    let q = supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });
    if (since) {
      q = q.gt("created_at", since);
    }
    const { data: messages, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: profiles } = await supabase.from("profiles").select("id, soul_id");
    const soulById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.soul_id]));

    const list = (messages ?? []).map((m) => ({
      id: m.id,
      sender_soul_id: soulById[m.sender_id] ?? "",
      is_me: m.sender_id === user.id,
      content: m.content,
      created_at: m.created_at,
    }));
    return NextResponse.json({ messages: list });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const { conversation_id, content } = body as { conversation_id?: string; content?: string };
    if (!conversation_id || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "conversation_id 与 content 必填" }, { status: 400 });
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, user_a_id, user_b_id, status")
      .eq("id", conversation_id)
      .single();
    if (!conv || conv.status !== "accepted") {
      return NextResponse.json({ error: "会话不存在或未连接" }, { status: 400 });
    }
    if (conv.user_a_id !== user.id && conv.user_b_id !== user.id) {
      return NextResponse.json({ error: "无权发送" }, { status: 403 });
    }

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_id: user.id,
        content: content.trim().slice(0, 2000),
      })
      .select("id, content, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: inserted });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
