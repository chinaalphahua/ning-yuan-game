import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);
    if (!memberships?.length) return NextResponse.json({ groups: [] });

    const groupIds = memberships.map((m) => m.group_id);
    const { data: groupRows } = await supabase
      .from("groups")
      .select("id, name, created_by_id, created_at")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    const list = (groupRows ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      created_by_id: g.created_by_id,
      created_at: g.created_at,
    }));
    return NextResponse.json({ groups: list });
  } catch {
    return NextResponse.json({ error: "服务器错误", groups: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 50) : "未命名群聊";
    const member_soul_ids = Array.isArray(body?.member_soul_ids)
      ? (body.member_soul_ids as string[]).filter((s): s is string => typeof s === "string").slice(0, 99)
      : [];

    const { data: group, error: groupErr } = await supabase
      .from("groups")
      .insert({ name, created_by_id: user.id })
      .select("id")
      .single();
    if (groupErr || !group) return NextResponse.json({ error: groupErr?.message ?? "创建失败" }, { status: 500 });

    const admin = createAdminClient();
    const { error: creatorMemberErr } = await admin
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });
    if (creatorMemberErr) return NextResponse.json({ error: `加入群失败: ${creatorMemberErr.message}` }, { status: 500 });

    if (member_soul_ids.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id")
        .in("soul_id", member_soul_ids);
      const toAdd = (profiles ?? []).map((p) => ({ group_id: group.id, user_id: p.id })).filter((r) => r.user_id !== user.id);
      if (toAdd.length) {
        const { error: addErr } = await admin.from("group_members").insert(toAdd);
        if (addErr) return NextResponse.json({ error: `拉人进群失败: ${addErr.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ group_id: group.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
