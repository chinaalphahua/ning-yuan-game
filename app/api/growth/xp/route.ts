import { createClient } from "@/lib/supabase/server";
import { awardXp } from "@/lib/growth/xp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const amount = body?.amount ?? 0;
    const source = body?.source ?? "other";
    if (typeof amount !== "number" || amount <= 0)
      return NextResponse.json({ error: "amount 必须为大于 0 的数字" }, { status: 400 });

    const result = await awardXp(user.id, amount, source);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
