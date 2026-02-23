import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const SLOTS = ["hair", "face", "accessory"] as const;
type Slot = (typeof SLOTS)[number];

/** POST：装备/卸下装扮。body: { slot: 'hair'|'face'|'accessory', cosmetic_key: string | null }，null 表示该槽位不装备。 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const { slot, cosmetic_key } = body as { slot?: string; cosmetic_key?: string | null };
    if (!slot || !SLOTS.includes(slot as Slot)) {
      return NextResponse.json({ error: "slot 必填且为 hair / face / accessory" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (cosmetic_key != null && cosmetic_key !== "") {
      const { data: item } = await admin
        .from("avatar_cosmetics")
        .select("key, slot")
        .eq("key", cosmetic_key)
        .single();
      if (!item || item.slot !== slot) {
        return NextResponse.json({ error: "物品不存在或槽位不匹配" }, { status: 400 });
      }
      const { data: owned } = await admin
        .from("user_cosmetics")
        .select("cosmetic_key")
        .eq("user_id", user.id)
        .eq("cosmetic_key", cosmetic_key)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json({ error: "尚未拥有该装扮" }, { status: 400 });
      }
    }

    const col = `equipped_${slot}_key` as "equipped_hair_key" | "equipped_face_key" | "equipped_accessory_key";
    const { error } = await admin
      .from("profiles")
      .update({ [col]: cosmetic_key && cosmetic_key.trim() ? cosmetic_key.trim() : null })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
