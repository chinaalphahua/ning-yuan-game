import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const { data: rows } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);
    const userIds = (rows ?? []).map((r) => r.user_id).filter(Boolean);
    if (userIds.length === 0) return NextResponse.json({ members: [] });

    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, soul_id, display_name")
      .in("id", userIds);
    const list = (profiles ?? []).map((p) => ({
      user_id: p.id,
      soul_id: p.soul_id,
      display_name: p.display_name ?? null,
    }));
    return NextResponse.json({ members: list });
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
    const member_soul_ids = Array.isArray(body?.member_soul_ids)
      ? (body.member_soul_ids as string[]).filter((s): s is string => typeof s === "string").slice(0, 99)
      : [];
    if (member_soul_ids.length === 0) return NextResponse.json({ error: "member_soul_ids 必填" }, { status: 400 });

    const { data: group } = await supabase.from("groups").select("created_by_id").eq("id", groupId).single();
    const { data: isMember } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    const canAdd = group?.created_by_id === user.id || isMember;
    if (!canAdd) return NextResponse.json({ error: "无权拉人" }, { status: 403 });

    const admin = createAdminClient();
    const { data: profiles } = await admin.from("profiles").select("id").in("soul_id", member_soul_ids);
    const toAdd = (profiles ?? []).map((p) => ({ group_id: groupId, user_id: p.id }));
    if (toAdd.length === 0) return NextResponse.json({ added: 0 });

    const { error } = await supabase.from("group_members").upsert(toAdd, { onConflict: "group_id,user_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ added: toAdd.length });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
