import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const targetSoulId = body?.target_soul_id as string | undefined;
    const content = body?.content as string | undefined;
    const tier = body?.tier as number | undefined;

    if (!targetSoulId || !targetSoulId.trim()) {
      return NextResponse.json({ error: "target_soul_id 必填" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "笺言内容不能为空" }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: "笺言内容过长（最多 500 字）" }, { status: 400 });
    }
    if (!tier || ![20, 40, 60, 80, 100].includes(tier)) {
      return NextResponse.json({ error: "tier 非法" }, { status: 400 });
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    if (!myProfile) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("soul_id", targetSoulId.trim())
      .single();
    if (!targetProfile || targetProfile.id === myProfile.id) {
      return NextResponse.json({ error: "目标灵魂不存在或无效" }, { status: 400 });
    }

    const { error } = await supabase.from("soul_letters").insert({
      sender_id: myProfile.id,
      recipient_id: targetProfile.id,
      tier,
      content: content.trim(),
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

