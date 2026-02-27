import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const letterId = body?.letter_id as string | undefined;
    const action = body?.action as "accept" | "reject" | "report" | undefined;

    if (!letterId) {
      return NextResponse.json({ error: "letter_id 必填" }, { status: 400 });
    }
    if (!action || !["accept", "reject", "report"].includes(action)) {
      return NextResponse.json({ error: "action 必须是 accept/reject/report" }, { status: 400 });
    }

    const { data: letter } = await supabase
      .from("soul_letters")
      .select("id, sender_id, recipient_id, status")
      .eq("id", letterId)
      .single();

    if (!letter) {
      return NextResponse.json({ error: "笺言不存在" }, { status: 404 });
    }
    if (letter.recipient_id !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }
    if (letter.status !== "pending") {
      return NextResponse.json({ error: "笺言已处理" }, { status: 400 });
    }

    let newStatus: "accepted" | "rejected" | "reported";
    if (action === "accept") newStatus = "accepted";
    else if (action === "reject") newStatus = "rejected";
    else newStatus = "reported";

    const { error: updateError } = await supabase
      .from("soul_letters")
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq("id", letterId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (action === "accept") {
      const userA = letter.sender_id as string;
      const userB = letter.recipient_id as string;
      const [minId, maxId] = userA < userB ? [userA, userB] : [userB, userA];

      const { data: existing } = await supabase
        .from("conversations")
        .select("id, status")
        .eq("user_a_id", minId)
        .eq("user_b_id", maxId)
        .maybeSingle();

      if (existing) {
        if (existing.status === "pending") {
          await supabase.from("conversations").update({ status: "accepted" }).eq("id", existing.id);
        }
      } else {
        await supabase.from("conversations").insert({
          user_a_id: minId,
          user_b_id: maxId,
          status: "accepted",
        });
      }
    }

    return NextResponse.json({ ok: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

