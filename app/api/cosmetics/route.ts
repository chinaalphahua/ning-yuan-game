import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** GET：装扮图鉴（全部物品，供前端按槽位/品质展示） */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("avatar_cosmetics")
      .select("key, name, slot, rarity, description, is_default")
      .order("rarity", { ascending: true })
      .order("key");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cosmetics: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
