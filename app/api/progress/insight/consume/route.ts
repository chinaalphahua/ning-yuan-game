import { createClient } from "@/lib/supabase/server";
import { consumeInsight } from "@/services/insight";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const amount = body?.amount ?? 0;
    const reason = body?.reason ?? "";
    if (typeof amount !== "number" || amount <= 0)
      return NextResponse.json({ error: "amount 必须为大于 0 的数字" }, { status: 400 });

    const insight = await consumeInsight(user.id, amount, reason);
    return NextResponse.json({ insight });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    if (msg === "余额不足")
      return NextResponse.json({ error: "余额不足" }, { status: 400 });
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
