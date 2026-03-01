import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const SOUL_ID_REGEX = /^NO\.NY-\d{4}-[AX]$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, display_name, soul_id } = body as {
      email?: string;
      password?: string;
      display_name?: string;
      soul_id?: string;
    };
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "邮箱与密码必填" }, { status: 400 });
    }
    const name = typeof display_name === "string" ? display_name.trim() || null : null;
    const sid = typeof soul_id === "string" && SOUL_ID_REGEX.test(soul_id) ? soul_id : null;

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name, soul_id: sid },
    });
    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    const userId = authData.user?.id;
    if (!userId) return NextResponse.json({ error: "创建用户失败" }, { status: 500 });

    const finalSoulId = sid || `NO.NY-${1000 + Math.floor(Math.random() * 9000)}-A`;
    const profilePayload: Record<string, unknown> = {
      id: userId,
      soul_id: finalSoulId,
      display_name: name,
    };
    // 先尝试带装扮（依赖 avatar_cosmetics 已 seed）
    let profileError = (
      await supabase.from("profiles").insert({
        ...profilePayload,
        equipped_hair_key: "hair_short_black",
        equipped_face_key: "face_default",
      })
    ).error;
    if (profileError) {
      // 若失败（如 avatar_cosmetics 未 seed 导致外键失败），则不带装扮再试
      const retry = await supabase.from("profiles").insert(profilePayload);
      profileError = retry.error;
    }
    if (profileError) {
      console.error("Register profile insert failed:", profileError);
      return NextResponse.json({ error: "创建档案失败" }, { status: 500 });
    }

    const { error: cosmeticsError } = await supabase.from("user_cosmetics").insert([
      { user_id: userId, cosmetic_key: "hair_short_black", quantity: 1 },
      { user_id: userId, cosmetic_key: "face_default", quantity: 1 },
    ]);
    if (cosmeticsError) console.warn("Register user_cosmetics insert failed (non-blocking):", cosmeticsError);

    return NextResponse.json({ soul_id: finalSoulId });
  } catch (e) {
    console.error("Register error:", e);
    const isDev = process.env.NODE_ENV === "development";
    let errorMessage = "服务器错误";
    if (isDev && e instanceof Error) {
      if (e.message.includes("Missing Supabase")) {
        errorMessage = "配置错误：请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY";
      } else {
        errorMessage = e.message.slice(0, 200);
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
