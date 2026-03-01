import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const questionId = body?.question_id;
    const choice = body?.choice;

    if (
      typeof questionId !== "number" ||
      questionId < 1 ||
      questionId > 100 ||
      (choice !== "A" && choice !== "B")
    ) {
      return NextResponse.json(
        { error: "question_id 为 1–100 的整数，choice 为 A 或 B" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error: upsertErr } = await admin.from("question_choices").upsert(
      {
        user_id: user.id,
        question_id: questionId,
        choice,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" }
    );
    if (upsertErr) {
      console.error("[play/choice] upsert error:", upsertErr.message);
    }

    const { data: rows } = await admin
      .from("question_choices")
      .select("choice")
      .eq("question_id", questionId);

    let countA = 0;
    let countB = 0;
    rows?.forEach((row) => {
      if (row.choice === "A") countA += 1;
      else countB += 1;
    });
    const total = countA + countB;
    const aPercent = total === 0 ? 50 : Math.round((countA / total) * 100);
    const bPercent = total === 0 ? 50 : 100 - aPercent;

    return NextResponse.json({
      a_percent: aPercent,
      b_percent: bPercent,
      total,
    });
  } catch (e) {
    console.error("[play/choice]", e);
    return NextResponse.json(
      { error: "记录选择失败" },
      { status: 500 }
    );
  }
}
