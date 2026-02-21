import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
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

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    let q = supabase
      .from("group_messages")
      .select("id, sender_id, content, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (since) q = q.gt("created_at", since);
    const { data: messages, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const senderIds = [...new Set((messages ?? []).map((m) => m.sender_id))];
    const admin = createAdminClient();
    const { data: profiles } = await admin.from("profiles").select("id, soul_id, display_name").in("id", senderIds);
    const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const list = (messages ?? []).map((m) => ({
      id: m.id,
      sender_soul_id: byId[m.sender_id]?.soul_id ?? "",
      sender_display_name: byId[m.sender_id]?.display_name ?? null,
      is_me: m.sender_id === user.id,
      content: m.content,
      created_at: m.created_at,
    }));
    return NextResponse.json({ messages: list });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id: groupId } = await params;
    if (!groupId) return NextResponse.json({ error: "group id 必填" }, { status: 400 });

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim().slice(0, 2000) : "";
    if (!content) return NextResponse.json({ error: "content 必填" }, { status: 400 });

    const { data: member } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "不在该群" }, { status: 403 });

    const { data: inserted, error } = await supabase
      .from("group_messages")
      .insert({ group_id: groupId, sender_id: user.id, content })
      .select("id, content, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: inserted });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
