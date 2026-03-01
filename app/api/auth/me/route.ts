import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SOUL_ID_REGEX = /^NO\.NY-\d{4}-[AX]$/;

/** 孤儿用户恢复：auth 有用户但 profiles 无记录时补建 profile（与 register 相同 fallback） */
async function ensureProfileForUser(userId: string, userMetadata: Record<string, unknown> | undefined): Promise<{ soul_id: string; display_name: string | null } | null> {
  const name = typeof userMetadata?.display_name === "string" ? userMetadata.display_name.trim() || null : null;
  const sidFromMeta = typeof userMetadata?.soul_id === "string" && SOUL_ID_REGEX.test(userMetadata.soul_id) ? userMetadata.soul_id : null;
  const finalSoulId = sidFromMeta || `NO.NY-${1000 + Math.floor(Math.random() * 9000)}-A`;

  const admin = createAdminClient();
  const profilePayload: Record<string, unknown> = {
    id: userId,
    soul_id: finalSoulId,
    display_name: name,
  };
  let profileError = (
    await admin.from("profiles").insert({
      ...profilePayload,
      equipped_hair_key: "hair_short_black",
      equipped_face_key: "face_default",
    })
  ).error;
  if (profileError) {
    const retry = await admin.from("profiles").insert(profilePayload);
    profileError = retry.error;
  }
  if (profileError) {
    console.warn("Auth me: ensureProfileForUser failed:", profileError);
    return null;
  }
  await admin.from("user_cosmetics").insert([
    { user_id: userId, cosmetic_key: "hair_short_black", quantity: 1 },
    { user_id: userId, cosmetic_key: "face_default", quantity: 1 },
  ]).then((r) => { if (r.error) console.warn("Auth me: user_cosmetics insert failed:", r.error); });
  return { soul_id: finalSoulId, display_name: name };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ user: null }, { status: 200 });
    let profile = (await supabase
      .from("profiles")
      .select("soul_id, display_name")
      .eq("id", user.id)
      .single()).data;
    if (!profile) {
      const created = await ensureProfileForUser(user.id, user.user_metadata);
      if (created) profile = created;
    }
    return NextResponse.json({
      user: { id: user.id, email: user.email, soul_id: profile?.soul_id ?? null, display_name: profile?.display_name ?? null },
    });
  } catch (e) {
    console.error("Auth me error:", e);
    const body: { user: null; debug?: string } = { user: null };
    if (process.env.NODE_ENV === "development" && e instanceof Error) {
      body.debug = e.message.includes("Missing Supabase")
        ? "配置错误：请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : e.message.slice(0, 200);
    }
    return NextResponse.json(body, { status: 500 });
  }
}
