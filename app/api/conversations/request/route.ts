import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const target_soul_id = body?.target_soul_id;
    if (typeof target_soul_id !== "string" || !target_soul_id.trim()) {
      return NextResponse.json({ error: "target_soul_id 必填" }, { status: 400 });
    }

    const { data: myProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
    const { data: targetProfile } = await supabase.from("profiles").select("id").eq("soul_id", target_soul_id.trim()).single();
    if (!myProfile || !targetProfile || targetProfile.id === myProfile.id) {
      return NextResponse.json({ error: "目标灵魂不存在或无效" }, { status: 400 });
    }

    const userA = myProfile.id;
    const userB = targetProfile.id;
    const [minId, maxId] = userA < userB ? [userA, userB] : [userB, userA];

    const { data: existing } = await supabase
      .from("conversations")
      .select("id, status")
      .eq("user_a_id", minId)
      .eq("user_b_id", maxId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ conversation_id: existing.id, already_accepted: true });
      }
      return NextResponse.json({ conversation_id: existing.id });
    }

    const { data: inserted, error } = await supabase
      .from("conversations")
      .insert({
        user_a_id: minId,
        user_b_id: maxId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ conversation_id: inserted.id });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
