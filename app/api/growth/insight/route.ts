import { createClient } from "@/lib/supabase/server";
import { addInsight, spendInsight } from "@/lib/growth/insight";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const amount = body?.amount ?? 0;
    const reason = body?.reason ?? "";
    if (typeof amount !== "number")
      return NextResponse.json({ error: "amount 必须为数字" }, { status: 400 });

    if (amount > 0) {
      const insight = await addInsight(user.id, amount, reason);
      return NextResponse.json({ insight });
    }
    if (amount < 0) {
      const insight = await spendInsight(user.id, -amount, reason);
      return NextResponse.json({ insight });
    }
    return NextResponse.json({ error: "amount 不能为 0" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    if (msg.includes("insight 不足"))
      return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
