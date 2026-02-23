import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/** GET：我的装扮背包 + 当前装备 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("equipped_hair_key, equipped_face_key, equipped_accessory_key")
      .eq("id", user.id)
      .single();

    const equippedKeys = [
      profile?.equipped_hair_key,
      profile?.equipped_face_key,
      profile?.equipped_accessory_key,
    ].filter(Boolean) as string[];

    const { data: equippedItems } = await equippedKeys.length
      ? admin.from("avatar_cosmetics").select("key, name, slot, rarity, description").in("key", equippedKeys)
      : { data: [] as { key: string; name: string; slot: string; rarity: string; description: string }[] };

    const equippedBySlot = new Map((equippedItems ?? []).map((i) => [i.slot, i]));

    const { data: rows } = await admin
      .from("user_cosmetics")
      .select("cosmetic_key, quantity, first_obtained_at")
      .eq("user_id", user.id);

    const keys = (rows ?? []).map((r) => r.cosmetic_key);
    const { data: items } = await keys.length
      ? admin.from("avatar_cosmetics").select("key, name, slot, rarity, description").in("key", keys)
      : { data: [] as { key: string; name: string; slot: string; rarity: string; description: string }[] };

    const byKey = new Map((items ?? []).map((i) => [i.key, i]));
    const inventory = (rows ?? []).map((r) => ({
      ...byKey.get(r.cosmetic_key),
      quantity: r.quantity,
      first_obtained_at: r.first_obtained_at,
    })).filter(Boolean);

    return NextResponse.json({
      equipped: {
        hair: profile?.equipped_hair_key ?? null,
        face: profile?.equipped_face_key ?? null,
        accessory: profile?.equipped_accessory_key ?? null,
      },
      equipped_items: {
        hair: equippedBySlot.get("hair") ?? null,
        face: equippedBySlot.get("face") ?? null,
        accessory: equippedBySlot.get("accessory") ?? null,
      },
      inventory,
    });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
